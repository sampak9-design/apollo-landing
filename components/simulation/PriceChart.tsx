"use client";

import { useEffect, useRef } from "react";

type Props = {
  basePrice: number;
  /** -1 força queda, 1 força alta, 0 movimento neutro */
  trend: -1 | 0 | 1;
  /** Preço de entrada da operação, ou null */
  entry: number | null;
  /** Direção da entrada — define cor e seta do marcador */
  side?: "buy" | "sell" | null;
  /** Texto do balão da entrada, ex: "R$ 100,00" */
  entryLabel?: string;
  /** Casas decimais do preço exibido */
  decimals?: number;
  onTick?: (price: number) => void;
};

const POINTS = 48;
const STEP_MS = 320;

// Gráfico em canvas: um único requestAnimationFrame, sem re-render do React
// por frame. O React só recebe o preço a cada passo (~3x por segundo).
export default function PriceChart({ basePrice, trend, entry, side = null, entryLabel = "", decimals = 2, onTick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trendRef = useRef(trend);
  const entryRef = useRef(entry);
  const onTickRef = useRef(onTick);
  const sideRef = useRef(side);
  const labelRef = useRef(entryLabel);

  trendRef.current = trend;
  entryRef.current = entry;
  onTickRef.current = onTick;
  sideRef.current = side;
  labelRef.current = entryLabel;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const vol = basePrice * 0.00022;
    const nextPrice = (from: number) =>
      from + (Math.random() - 0.5) * 2 * vol + trendRef.current * vol * 0.75;

    const points: number[] = [basePrice];
    for (let i = 1; i < POINTS; i++) points.push(nextPrice(points[i - 1]));
    let target = nextPrice(points[POINTS - 1]);
    let stepStart = performance.now();
    // Momento da entrada (em passos) para o marcador acompanhar a rolagem
    let stepCount = 0;
    let entryAt: { step: number; t: number } | null = null;

    let width = 0;
    let height = 0;
    let lo = Math.min(...points);
    let hi = Math.max(...points);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    const draw = (now: number) => {
      let t = (now - stepStart) / STEP_MS;
      if (t >= 1) {
        points.push(target);
        points.shift();
        target = nextPrice(target);
        stepStart = now;
        stepCount++;
        t = 0;
        onTickRef.current?.(points[POINTS - 1]);
      }

      const last = points[POINTS - 1];
      const head = last + (target - last) * t;
      const padRight = 64;
      const dx = (width - padRight) / (POINTS - 1);
      const entryPrice = entryRef.current;
      if (entryPrice === null) entryAt = null;
      else if (!entryAt) entryAt = { step: stepCount, t };

      // Escala vertical suavizada para evitar saltos
      let min = Math.min(head, ...points);
      let max = Math.max(head, ...points);
      if (entryPrice !== null) {
        min = Math.min(min, entryPrice);
        max = Math.max(max, entryPrice);
      }
      const margin = (max - min) * 0.25 || vol;
      lo += (min - margin - lo) * 0.08;
      hi += (max + margin - hi) * 0.08;
      const y = (p: number) => height - ((p - lo) / (hi - lo)) * height;

      ctx.clearRect(0, 0, width, height);

      // Grade
      ctx.strokeStyle = "rgba(0, 217, 255, 0.06)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const gy = Math.round((height / 4) * i) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      const headX = width - padRight;
      const headY = y(head);
      const path = new Path2D();
      points.forEach((p, i) => {
        const px = (i - t) * dx;
        if (i === 0) path.moveTo(px, y(p));
        else path.lineTo(px, y(p));
      });
      path.lineTo(headX, headY);

      // Preenchimento
      const fill = new Path2D(path);
      fill.lineTo(headX, height);
      fill.lineTo(-dx, height);
      fill.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, "rgba(0, 217, 255, 0.22)");
      grad.addColorStop(1, "rgba(0, 217, 255, 0)");
      ctx.fillStyle = grad;
      ctx.fill(fill);

      // Linha com brilho (traço largo translúcido em vez de shadowBlur)
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(0, 217, 255, 0.18)";
      ctx.lineWidth = 6;
      ctx.stroke(path);
      ctx.strokeStyle = "#00D9FF";
      ctx.lineWidth = 2;
      ctx.stroke(path);

      // Linha de entrada (desenhada antes do ponto atual)
      let marker: (() => void) | null = null;
      if (entryPrice !== null && entryAt) {
        const buy = sideRef.current !== "sell";
        const color = buy ? "#10B981" : "#F43F5E";
        const ey = Math.round(y(entryPrice)) + 0.5;

        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = buy ? "rgba(16, 185, 129, 0.55)" : "rgba(244, 63, 94, 0.55)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, ey);
        ctx.lineTo(width, ey);
        ctx.stroke();
        ctx.setLineDash([]);

        const ex = (POINTS - 1 - (stepCount - entryAt.step) - t + entryAt.t) * dx;
        if (ex > -40) {
          marker = () => {
            // Ponto da entrada
            ctx.beginPath();
            ctx.arc(ex, ey, 5, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#0B1220";
            ctx.stroke();

            // Balão com seta + valor (acima na compra, abaixo na venda)
            const text = labelRef.current;
            ctx.font = "700 11px system-ui, sans-serif";
            const bw = ctx.measureText(text).width + 30;
            const bh = 22;
            const gap = 12;
            const bx = Math.min(Math.max(ex - bw / 2, 2), width - bw - 2);
            const by = buy ? ey - gap - bh : ey + gap;
            const clampedY = Math.min(Math.max(by, 2), height - bh - 2);

            ctx.fillStyle = color;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(bx, clampedY, bw, bh, 6);
            else ctx.rect(bx, clampedY, bw, bh);
            ctx.fill();
            // Rabinho do balão apontando para a entrada
            ctx.beginPath();
            const tailX = Math.min(Math.max(ex, bx + 8), bx + bw - 8);
            if (buy) {
              ctx.moveTo(tailX - 5, clampedY + bh);
              ctx.lineTo(tailX + 5, clampedY + bh);
              ctx.lineTo(tailX, clampedY + bh + 6);
            } else {
              ctx.moveTo(tailX - 5, clampedY);
              ctx.lineTo(tailX + 5, clampedY);
              ctx.lineTo(tailX, clampedY - 6);
            }
            ctx.fill();

            // Seta
            const ax = bx + 11;
            const ay = clampedY + bh / 2;
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            if (buy) {
              ctx.moveTo(ax, ay - 5);
              ctx.lineTo(ax + 5, ay + 3);
              ctx.lineTo(ax - 5, ay + 3);
            } else {
              ctx.moveTo(ax, ay + 5);
              ctx.lineTo(ax + 5, ay - 3);
              ctx.lineTo(ax - 5, ay - 3);
            }
            ctx.fill();
            ctx.fillText(text, bx + 21, ay + 4);
          };
        }
      }

      // Ponto atual pulsando
      const pulse = (now % 1400) / 1400;
      ctx.beginPath();
      ctx.arc(headX, headY, 4 + pulse * 10, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 217, 255, ${0.35 * (1 - pulse)})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(headX, headY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();

      // Etiqueta de preço
      const label = head.toFixed(decimals);
      ctx.font = "600 10px system-ui, sans-serif";
      const lw = ctx.measureText(label).width + 10;
      const ly = Math.min(Math.max(headY - 9, 0), height - 18);
      ctx.fillStyle = "#00D9FF";
      ctx.beginPath();
      // roundRect não existe no Safari < 16
      if (ctx.roundRect) ctx.roundRect(width - lw - 2, ly, lw, 18, 4);
      else ctx.rect(width - lw - 2, ly, lw, 18);
      ctx.fill();
      ctx.fillStyle = "#020817";
      ctx.fillText(label, width - lw + 3, ly + 12.5);

      marker?.();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [basePrice, decimals]);

  return <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />;
}
