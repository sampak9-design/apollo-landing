// Funil próprio: envia etapas, cliques, tempo ativo e saída de cada visita
// para o Tracker (POST /tracker/funil). Usa o mesmo ID anônimo do tracker.js
// (_trk_eid) para ligar a visita às entradas no Telegram.

export type FunnelStep = "pagina" | "iniciou" | "analise" | "entrada" | "resultado" | "licenca" | "telegram";

type FunnelEvent = {
  tipo: "etapa" | "clique" | "saida";
  nome?: string;
  etapa: FunnelStep;
  t_ms: number;
  x?: number;
  y?: number;
};

const FALLBACK_ENDPOINT = "https://track-production-cd03.up.railway.app/tracker/funil";
const HEARTBEAT_MS = 30_000;
const DEBOUNCE_MS = 2_000;

let started = false;
let endpoint = "";
let sessaoId = "";
let lang = "";
let etapa: FunnelStep = "pagina";
let t0 = 0;
let fila: FunnelEvent[] = [];
let metaEnviada = false;
let cliques = 0;
let clicouTelegram = false;
let tempoAtivo = 0;
let visivelDesde: number | null = null;
let debounce: ReturnType<typeof setTimeout> | undefined;

const agora = () => Math.round(performance.now() - t0);

function tempoAtivoAtual() {
  return tempoAtivo + (visivelDesde !== null ? performance.now() - visivelDesde : 0);
}

function lerStorage(chave: string) {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function resolverEndpoint() {
  const custom = process.env.NEXT_PUBLIC_FUNIL_ENDPOINT;
  if (custom) return custom;
  const tag = document.querySelector<HTMLScriptElement>('script[src*="/static/tracker.js"]');
  return tag ? tag.src.replace("/static/tracker.js", "/tracker/funil") : FALLBACK_ENDPOINT;
}

function detectarAmbiente() {
  const ua = navigator.userAgent;
  const toque = window.matchMedia("(pointer: coarse)").matches;
  const device = /iPad|Tablet/i.test(ua) || (toque && Math.min(screen.width, screen.height) >= 768)
    ? "tablet"
    : toque || /Mobi|Android|iPhone/i.test(ua)
      ? "mobile"
      : "desktop";
  const os = /iPhone|iPad|iPod/i.test(ua)
    ? "iOS"
    : /Android/i.test(ua)
      ? "Android"
      : /Windows/i.test(ua)
        ? "Windows"
        : /Mac OS X/i.test(ua)
          ? "macOS"
          : /Linux/i.test(ua)
            ? "Linux"
            : "Outro";
  // Navegadores internos do Instagram/Facebook contam muito para anúncio
  const browser = /Instagram/i.test(ua)
    ? "Instagram"
    : /FBAN|FBAV|FB_IAB/i.test(ua)
      ? "Facebook"
      : /Edg\//i.test(ua)
        ? "Edge"
        : /SamsungBrowser/i.test(ua)
          ? "Samsung"
          : /CriOS|Chrome/i.test(ua)
            ? "Chrome"
            : /Safari/i.test(ua)
              ? "Safari"
              : /Firefox|FxiOS/i.test(ua)
                ? "Firefox"
                : "Outro";
  return { device, os, browser };
}

function montarMeta() {
  const params = new URLSearchParams(location.search);
  let salvos: Record<string, string> = {};
  try {
    salvos = JSON.parse(lerStorage("_trk_utms") || "{}");
  } catch {}
  const utm = (k: string) => params.get(k) || salvos[k] || undefined;
  return {
    external_id: lerStorage("_trk_eid") || undefined,
    page_url: location.href,
    lang,
    ...detectarAmbiente(),
    screen_w: screen.width,
    screen_h: screen.height,
    referrer: document.referrer || undefined,
    utm_source: utm("utm_source"),
    utm_medium: utm("utm_medium"),
    utm_campaign: utm("utm_campaign"),
    utm_content: utm("utm_content"),
    utm_term: utm("utm_term"),
  };
}

function enviar(saiu = false) {
  clearTimeout(debounce);
  const corpo = JSON.stringify({
    sessao_id: sessaoId,
    meta: metaEnviada ? undefined : montarMeta(),
    eventos: fila,
    resumo: {
      etapa,
      tempo_ativo_ms: Math.round(tempoAtivoAtual()),
      cliques,
      clicou_telegram: clicouTelegram,
      saiu,
    },
  });
  fila = [];
  metaEnviada = true;

  if (process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_FUNIL_ENDPOINT) {
    console.info("[funil]", JSON.parse(corpo));
    return;
  }
  // text/plain evita preflight de CORS; sendBeacon continua funcionando ao fechar a aba
  const blob = new Blob([corpo], { type: "text/plain" });
  if (!navigator.sendBeacon?.(endpoint, blob)) {
    fetch(endpoint, { method: "POST", body: corpo, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(() => {});
  }
}

function agendarEnvio() {
  clearTimeout(debounce);
  debounce = setTimeout(() => enviar(), DEBOUNCE_MS);
}

function nomeDoElemento(el: Element | null): string {
  const alvo = el?.closest("[data-funil],button,a,[role=button]");
  if (alvo) {
    const marcado = alvo.getAttribute("data-funil");
    if (marcado) return marcado;
    const texto = (alvo.getAttribute("aria-label") || alvo.textContent || "").replace(/\s+/g, " ").trim();
    return `${alvo.tagName.toLowerCase()}: ${texto.slice(0, 60)}`;
  }
  return el ? el.tagName.toLowerCase() : "?";
}

function aoClicar(e: PointerEvent) {
  cliques++;
  const doc = document.documentElement;
  fila.push({
    tipo: "clique",
    nome: nomeDoElemento(e.target as Element),
    etapa,
    t_ms: agora(),
    x: e.pageX / Math.max(doc.scrollWidth, 1),
    y: e.pageY / Math.max(doc.scrollHeight, 1),
  });
  agendarEnvio();
}

function aoMudarVisibilidade() {
  if (document.visibilityState === "hidden") {
    if (visivelDesde !== null) {
      tempoAtivo += performance.now() - visivelDesde;
      visivelDesde = null;
    }
    fila.push({ tipo: "saida", etapa, t_ms: agora() });
    enviar(true);
  } else if (visivelDesde === null) {
    visivelDesde = performance.now();
    agendarEnvio();
  }
}

/** Inicia o funil uma vez por carregamento de página. */
export function startFunnel(idioma: string) {
  if (started || typeof window === "undefined") return;
  started = true;
  lang = idioma;
  endpoint = resolverEndpoint();
  sessaoId = crypto.randomUUID?.() ?? `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  t0 = performance.now();
  visivelDesde = document.visibilityState === "visible" ? t0 : null;

  document.addEventListener("pointerdown", aoClicar, { capture: true, passive: true });
  document.addEventListener("visibilitychange", aoMudarVisibilidade);
  window.addEventListener("pagehide", () => {
    if (document.visibilityState !== "hidden") aoMudarVisibilidade();
  });
  setInterval(() => document.visibilityState === "visible" && enviar(), HEARTBEAT_MS);

  funnelStep("pagina");
}

/** Registra a chegada a uma etapa (só avança, nunca volta). */
export function funnelStep(nome: FunnelStep) {
  if (!started) return;
  etapa = nome;
  if (nome === "telegram") clicouTelegram = true;
  fila.push({ tipo: "etapa", nome, etapa: nome, t_ms: agora() });
  // Clique no Telegram abre outra aba: envia na hora para não perder
  if (nome === "telegram") enviar();
  else agendarEnvio();
}
