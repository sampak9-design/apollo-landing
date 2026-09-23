"use client";

import { useEffect, useState } from "react";

// Conta até uma data real (OFFER_DEADLINE), igual para todos os visitantes.
// Não reinicia ao recarregar a página.
export default function Countdown({ deadline }: { deadline: number }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = now === null ? null : Math.max(0, deadline - now);

  if (remaining === 0) {
    return (
      <p className="text-center text-xs uppercase tracking-widest text-white/50">
        Prazo desta liberação encerrado
      </p>
    );
  }

  const total = Math.floor((remaining ?? 0) / 1000);
  const days = Math.floor(total / 86400);
  const units: [string, number][] = [
    ...(days > 0 ? [["dias", days] as [string, number]] : []),
    ["horas", Math.floor((total % 86400) / 3600)],
    ["min", Math.floor((total % 3600) / 60)],
    ["seg", total % 60],
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
        Disponível por
      </span>
      <div className="flex items-start gap-1.5 font-display" suppressHydrationWarning>
        {units.map(([label, value], i) => (
          <div key={label} className="flex items-start gap-1.5">
            {i > 0 && <span className="pt-2 text-lg text-apollo-cyan/60">:</span>}
            <div className="flex flex-col items-center">
              <span className="min-w-[3rem] rounded-lg border border-apollo-cyan/20 bg-apollo-panel px-2 py-1.5 text-center text-2xl font-bold tabular-nums text-white">
                {remaining === null ? "--" : String(value).padStart(2, "0")}
              </span>
              <span className="mt-1 text-[9px] uppercase tracking-widest text-white/40">{label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
