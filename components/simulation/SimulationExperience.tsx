"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, animate, motion } from "framer-motion";
import ApolloLogo from "@/components/ApolloLogo";
import PriceChart from "./PriceChart";
import Countdown from "./Countdown";
import { track } from "@/lib/tracking";
import {
  FREE_LICENSES,
  OFFER_DEADLINE,
  SIMULATION as SIM,
  TELEGRAM_URL,
  brl,
} from "@/lib/offer";

type Phase = "idle" | "analyzing" | "operating" | "result" | "unlocked";
type Side = "buy" | "sell";

const SOUNDS = {
  entry: "/sounds/entry.mp3",
  result: "/sounds/coins.mp3",
};

const PROFIT = (SIM.startBalance * SIM.payoutPercent) / 100;
const FINAL_BALANCE = SIM.startBalance + PROFIT;

const panel = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

export default function SimulationExperience() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [side, setSide] = useState<Side | null>(null);
  const [price, setPrice] = useState(SIM.basePrice);
  const [entry, setEntry] = useState<number | null>(null);
  const priceRef = useRef(SIM.basePrice);
  const sounds = useRef<Partial<Record<keyof typeof SOUNDS, HTMLAudioElement>>>({});
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    try {
      setMuted(localStorage.getItem("apollo_sim_muted") === "1");
    } catch {}
  }, []);

  const toggleMuted = () => {
    setMuted((m) => {
      try {
        localStorage.setItem("apollo_sim_muted", m ? "0" : "1");
      } catch {}
      return !m;
    });
  };

  const onTick = useCallback((p: number) => {
    priceRef.current = p;
    setPrice(p);
  }, []);

  // A direção é decidida pela "IA" no início e revelada no fim da análise.
  const start = () => {
    if (phase !== "idle") return;
    track("SimulationStarted");
    // O navegador só libera áudio dentro de um clique: tocamos mudo aqui
    // para destravar (principalmente no iPhone) e usamos depois.
    for (const [name, src] of Object.entries(SOUNDS) as [keyof typeof SOUNDS, string][]) {
      const audio = new Audio(src);
      audio.preload = "auto";
      audio.muted = true;
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
        })
        .catch(() => {});
      sounds.current[name] = audio;
    }
    setSide(Math.random() < 0.5 ? "buy" : "sell");
    setPhase("analyzing");
  };

  // Máquina de estados: cada fase agenda a próxima.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const play = (name: keyof typeof SOUNDS) => {
      const audio = sounds.current[name];
      if (!audio || muted) return;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    };

    if (phase === "analyzing") {
      if (side) track("SignalGenerated", { side });
      timer = setTimeout(() => {
        setEntry(priceRef.current);
        setPhase("operating");
      }, SIM.analyzeMs);
    } else if (phase === "operating") {
      play("entry");
      timer = setTimeout(() => setPhase("result"), SIM.operateMs);
    } else if (phase === "result") {
      track("SimulationCompleted", { side, virtual_profit: PROFIT });
      play("result");
      timer = setTimeout(() => setPhase("unlocked"), SIM.resultMs);
    } else if (phase === "unlocked") {
      track("LicenseUnlocked");
    }
    return () => clearTimeout(timer);
    // `muted` fica de fora para não reagendar as fases ao alternar o som
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, side]);

  const trend = phase === "operating" && side ? (side === "buy" ? 1 : -1) : 0;
  const change = ((price - SIM.basePrice) / SIM.basePrice) * 100;

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative min-h-[100dvh] w-full overflow-hidden bg-apollo-dark">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-apollo-blue/20 blur-3xl" />

        <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 pb-6 pt-4">
          <header className="flex items-center justify-between">
            <ApolloLogo className="[&_span]:text-xl [&_svg]:h-8 [&_svg]:w-8" />
            <div className="flex items-center gap-4">
              <button
                onClick={toggleMuted}
                aria-label={muted ? "Ativar som" : "Desativar som"}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 5 6 9H2v6h4l5 4V5z" />
                  {muted ? <path d="m23 9-6 6M17 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />}
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                <span className="text-[10px] font-medium uppercase tracking-widest text-green-400 sm:text-xs">
                  Online
                </span>
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {phase === "unlocked" ? (
              <Unlocked key="unlocked" />
            ) : (
              <motion.section key="terminal" {...panel} className="mt-5 flex flex-1 flex-col">
                {phase === "idle" && (
                  <div className="mb-4 mt-6 flex flex-col items-center text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-apollo-cyan/30 bg-apollo-cyan/5 px-3 py-1.5 backdrop-blur-sm">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-apollo-cyan" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-apollo-cyan">
                        Inteligência Artificial · 2026
                      </span>
                    </div>

                    <h1 className="mb-3 text-balance font-display text-2xl font-black uppercase leading-[1.1] tracking-tight sm:text-3xl">
                      <span className="block neon-text">A inteligência artificial</span>
                      <span className="block bg-gradient-to-r from-apollo-cyan via-apollo-blue to-apollo-cyan bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,217,255,0.5)]">
                        que opera por você
                      </span>
                    </h1>

                    <p className="text-sm text-white/70">
                      Faça uma <span className="font-semibold text-white">operação</span> e
                      veja a <span className="font-semibold text-apollo-cyan">Apollo IA</span> em ação.
                    </p>
                  </div>
                )}

                {/* Terminal */}
                <div className="overflow-hidden rounded-2xl border border-apollo-cyan/15 bg-apollo-panel/80 shadow-[0_0_40px_rgba(0,150,255,0.12)] backdrop-blur">
                  <div className="flex items-center justify-between px-4 pt-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-apollo-blue/15 text-base font-bold text-apollo-cyan">
                        {SIM.assetIcon}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{SIM.asset}</p>
                        <p className="text-[11px] text-white/40">{SIM.assetName} · 1 min</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-sm font-bold tabular-nums text-white">
                        {price.toFixed(SIM.priceDecimals)}
                      </p>
                      <p className={`text-[11px] font-semibold tabular-nums ${change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {change >= 0 ? "+" : ""}
                        {change.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  <StatusBar phase={phase} side={side} />

                  <div className="h-48 sm:h-56">
                    <PriceChart
                      basePrice={SIM.basePrice}
                      trend={trend}
                      entry={entry}
                      side={side}
                      entryLabel={brl(SIM.startBalance)}
                      decimals={SIM.priceDecimals}
                      onTick={onTick}
                    />
                  </div>

                  <BalanceRow phase={phase} />
                </div>

                {/* Painel de ação */}
                <div className="mt-4 flex-1">
                  <AnimatePresence mode="wait">
                    {phase === "idle" && <StartButton key="idle" onStart={start} />}
                    {phase === "analyzing" && side && <Analyzing key="analyzing" side={side} />}
                    {phase === "operating" && side && <Operating key="operating" side={side} />}
                    {phase === "result" && <Result key="result" onSkip={() => setPhase("unlocked")} />}
                  </AnimatePresence>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <footer className="mt-6 text-center">
            <p className="text-[10px] uppercase tracking-widest text-white/30 sm:text-xs">
              © {new Date().getFullYear()} Apollo IA · Todos os direitos reservados
            </p>
          </footer>
        </div>
      </main>
    </MotionConfig>
  );
}

function StatusBar({ phase, side }: { phase: Phase; side: Side | null }) {
  const text =
    phase === "idle"
      ? "Apollo IA monitorando o mercado"
      : phase === "analyzing"
        ? "Analisando o mercado…"
        : phase === "operating"
          ? `Operação de ${side === "buy" ? "compra" : "venda"} em andamento`
          : "Operação finalizada";
  const active = phase === "analyzing" || phase === "operating";

  return (
    <div className="mt-3 flex items-center gap-2 px-4">
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "animate-pulse bg-apollo-cyan" : "bg-emerald-400"}`} />
      <span className="text-[11px] font-medium uppercase tracking-widest text-white/50">{text}</span>
    </div>
  );
}

function BalanceRow({ phase }: { phase: Phase }) {
  const [value, setValue] = useState(SIM.startBalance);

  useEffect(() => {
    if (phase !== "result") return;
    const controls = animate(SIM.startBalance, FINAL_BALANCE, {
      duration: 1.4,
      delay: 0.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: setValue,
    });
    return () => controls.stop();
  }, [phase]);

  return (
    <div className="flex items-center justify-between border-t border-white/5 bg-black/20 px-4 py-3">
      <span className="text-[11px] uppercase tracking-widest text-white/40">Saldo</span>
      <span className={`font-display text-base font-bold tabular-nums ${value > SIM.startBalance ? "text-emerald-400" : "text-white"}`}>
        {brl(value)}
      </span>
    </div>
  );
}

function StartButton({ onStart }: { onStart: () => void }) {
  return (
    <motion.div {...panel}>
      <button
        onClick={onStart}
        className="group relative flex h-16 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-apollo-cyan/40 bg-gradient-to-r from-apollo-blue to-apollo-cyan font-display text-sm font-bold uppercase tracking-wider text-white btn-glow transition active:scale-95 sm:text-base"
      >
        <span className="absolute inset-0 -translate-x-full animate-[shine_2.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        <svg viewBox="0 0 24 24" className="relative h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M7.8 7.8 6.3 6.3M17.7 17.7l-1.5-1.5M7.8 16.2l-1.5 1.5M17.7 6.3l-1.5 1.5" />
          <circle cx="12" cy="12" r="3.5" />
        </svg>
        <span className="relative">Iniciar operação com a IA</span>
      </button>
      <p className="mt-3 text-center text-[11px] text-white/40">
        A Apollo IA analisa o gráfico e decide a entrada · {brl(SIM.startBalance)}
      </p>
    </motion.div>
  );
}

const ANALYSIS_STEPS = ["Lendo volume e liquidez", "Identificando tendência", "Definindo direção da entrada"];

function Analyzing({ side }: { side: Side }) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    // Reserva ~1,3s no fim para o sinal ficar visível antes de entrar
    const step = (SIM.analyzeMs - 1300) / ANALYSIS_STEPS.length;
    const id = setInterval(() => setDone((d) => Math.min(d + 1, ANALYSIS_STEPS.length)), step);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div {...panel} className="rounded-2xl border border-apollo-cyan/15 bg-apollo-panel/60 p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="relative flex h-8 w-8 items-center justify-center">
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-apollo-cyan/20 border-t-apollo-cyan" />
          <span className="h-2 w-2 rounded-full bg-apollo-cyan" />
        </span>
        <p className="font-display text-sm font-semibold text-white">Apollo IA analisando o mercado…</p>
      </div>
      <ul className="space-y-2">
        {ANALYSIS_STEPS.map((label, i) => (
          <li key={label} className={`flex items-center gap-2 text-xs transition-colors duration-300 ${i < done ? "text-white/80" : "text-white/30"}`}>
            <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${i < done ? "bg-apollo-cyan text-apollo-dark" : "border border-white/20"}`}>
              {i < done ? "✓" : ""}
            </span>
            {label}
          </li>
        ))}
      </ul>
      <AnimatePresence>
        {done >= ANALYSIS_STEPS.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mt-4 flex items-center justify-between rounded-xl border px-3 py-2.5 ${side === "buy" ? "border-emerald-400/30 bg-emerald-400/10" : "border-rose-400/30 bg-rose-400/10"}`}
          >
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/60">Sinal identificado</span>
            <span className={`font-display text-sm font-bold ${side === "buy" ? "text-emerald-400" : "text-rose-400"}`}>
              {side === "buy" ? "COMPRA ↑" : "VENDA ↓"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Operating({ side }: { side: Side }) {
  const [pnl, setPnl] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => {
      const t = Math.min((performance.now() - start) / SIM.operateMs, 1);
      const eased = 1 - Math.pow(1 - t, 2);
      const noise = (Math.random() - 0.5) * PROFIT * 0.12 * (1 - t);
      setPnl(Math.max(0, eased * PROFIT + noise));
      setElapsed(t);
    }, 120);
    return () => clearInterval(id);
  }, []);

  const secondsLeft = Math.ceil((1 - elapsed) * (SIM.operateMs / 1000));

  return (
    <motion.div {...panel} className="rounded-2xl border border-apollo-cyan/15 bg-apollo-panel/60 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-sm font-semibold text-white">Operação em andamento…</p>
          <p className="mt-0.5 text-[11px] text-white/40">
            {side === "buy" ? "Compra ↑" : "Venda ↓"} · entrada {brl(SIM.startBalance)}
          </p>
        </div>
        <span className="font-display text-sm tabular-nums text-white/60">00:0{secondsLeft}</span>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <span className="text-[11px] uppercase tracking-widest text-white/40">Resultado parcial</span>
        <span className="font-display text-xl font-bold tabular-nums text-emerald-400">+{brl(pnl)}</span>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-apollo-blue to-apollo-cyan"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: SIM.operateMs / 1000, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}

function Result({ onSkip }: { onSkip: () => void }) {
  return (
    <motion.div {...panel} className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">Operação finalizada · simulação</p>
      <motion.p
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 18 }}
        className="mt-2 font-display text-4xl font-black text-emerald-400 drop-shadow-[0_0_24px_rgba(16,185,129,0.45)]"
      >
        +{brl(PROFIT)}
      </motion.p>
      <p className="mt-3 text-sm text-white/60">
        Saldo: <span className="text-white/80">{brl(SIM.startBalance)}</span> →{" "}
        <span className="font-semibold text-emerald-400">{brl(FINAL_BALANCE)}</span>
      </p>
      <button onClick={onSkip} className="mt-4 text-xs font-semibold uppercase tracking-widest text-apollo-cyan">
        Continuar →
      </button>
      <div className="mt-3 h-0.5 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full bg-apollo-cyan/60"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: SIM.resultMs / 1000, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}

function Unlocked() {
  const title = FREE_LICENSES
    ? `${FREE_LICENSES} licenças gratuitas da Apollo IA`
    : "Licença gratuita da Apollo IA";

  return (
    <motion.section {...panel} className="mt-8 flex flex-1 flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
        className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-apollo-cyan/30 bg-apollo-panel shadow-[0_0_50px_rgba(0,217,255,0.3)]"
      >
        <svg viewBox="0 0 24 24" className="h-9 w-9 text-apollo-cyan" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <motion.path
            d="M7 11V7a5 5 0 0 1 9.9-1"
            initial={{ rotate: 0, y: 0 }}
            animate={{ y: -2, rotate: -18 }}
            style={{ originX: "90%", originY: "100%" }}
            transition={{ delay: 0.45, duration: 0.4, ease: "easeOut" }}
          />
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <circle cx="12" cy="16" r="1.3" fill="currentColor" />
        </svg>
      </motion.div>

      <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-apollo-cyan">Benefício desbloqueado</p>
      <h1 className="mt-3 font-display text-2xl font-black uppercase leading-tight text-white neon-text">{title}</h1>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
        Você concluiu sua primeira operação e desbloqueou uma licença gratuita da Apollo IA.
      </p>

      {OFFER_DEADLINE && (
        <div className="mt-7">
          <Countdown deadline={OFFER_DEADLINE} />
        </div>
      )}

      <a
        href={TELEGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("TelegramClicked")}
        className="group relative mt-8 flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-apollo-cyan/40 bg-gradient-to-r from-apollo-blue to-apollo-cyan px-5 py-4 font-display text-sm font-bold uppercase tracking-wider text-white btn-glow transition active:scale-95"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0 fill-current" aria-hidden="true">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.643.135-.953l11.566-4.458c.538-.196 1.006.128.832.939z" />
        </svg>
        <span>Receber minha licença gratuita</span>
      </a>

      <p className="mt-4 text-[11px] text-white/40">
        Sua comissão: <span className="text-emerald-400/80">+{brl(PROFIT)}</span>
      </p>
    </motion.section>
  );
}
