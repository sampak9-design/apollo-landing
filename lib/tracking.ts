// Eventos customizados enviados ao Meta Pixel (os pixels são inicializados em
// app/layout.tsx). UTMs e o clique no Telegram já são capturados pelo
// tracker.js do layout, então aqui só registramos as etapas da simulação.

export type SimulationEvent =
  | "SimulationStarted"
  | "SignalGenerated"
  | "SimulationCompleted"
  | "LicenseUnlocked"
  | "TelegramClicked";

import { type FunnelStep, funnelStep } from "./funnel";

// Cada evento do Pixel também vira uma etapa do funil próprio (Tracker)
const FUNNEL_STEPS: Partial<Record<SimulationEvent, FunnelStep>> = {
  SimulationStarted: "iniciou",
  SignalGenerated: "analise",
  SimulationCompleted: "resultado",
  LicenseUnlocked: "licenca",
  TelegramClicked: "telegram",
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// Parâmetros enviados junto com todo evento (ex: idioma escolhido)
let baseParams: Record<string, unknown> = {};
export function setTrackingParams(params: Record<string, unknown>) {
  baseParams = { ...baseParams, ...params };
}

export function track(event: SimulationEvent, extra?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const params = { ...baseParams, ...extra };
  const step = FUNNEL_STEPS[event];
  if (step) funnelStep(step);

  // Em desenvolvimento só loga, para não sujar os dados do pixel real.
  if (process.env.NODE_ENV !== "production") {
    console.info("[track]", event, params);
    return;
  }

  window.fbq?.("trackCustom", event, params);
}
