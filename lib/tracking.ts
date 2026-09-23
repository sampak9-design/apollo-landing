// Eventos customizados enviados ao Meta Pixel (os pixels são inicializados em
// app/layout.tsx). UTMs e o clique no Telegram já são capturados pelo
// tracker.js do layout, então aqui só registramos as etapas da simulação.

export type SimulationEvent =
  | "SimulationStarted"
  | "SignalGenerated"
  | "SimulationCompleted"
  | "LicenseUnlocked"
  | "TelegramClicked";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function track(event: SimulationEvent, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  // Em desenvolvimento só loga, para não sujar os dados do pixel real.
  if (process.env.NODE_ENV !== "production") {
    console.info("[track]", event, params ?? {});
    return;
  }

  window.fbq?.("trackCustom", event, params);
}
