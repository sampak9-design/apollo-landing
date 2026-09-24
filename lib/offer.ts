// Configuração da experiência de simulação.
// Quantidade de licenças e prazo só aparecem na página se estiverem
// definidos no ambiente — sem valor configurado, nada de escassez.

const TELEGRAM_URL = "https://t.me/+vWYX93dvUA5hYjgx";

// Link do Telegram por idioma (NEXT_PUBLIC_TELEGRAM_URL_ES sobrescreve o do México)
export const TELEGRAM_URLS = {
  pt: TELEGRAM_URL,
  es: process.env.NEXT_PUBLIC_TELEGRAM_URL_ES || "https://t.me/apollomx",
};

const licenses = Number(process.env.NEXT_PUBLIC_FREE_LICENSES);
export const FREE_LICENSES: number | null =
  Number.isFinite(licenses) && licenses > 0 ? Math.floor(licenses) : null;

// Data/hora ISO de encerramento real da oferta, ex: 2026-09-30T23:59:00-03:00
const deadline = Date.parse(process.env.NEXT_PUBLIC_OFFER_DEADLINE ?? "");
export const OFFER_DEADLINE: number | null = Number.isFinite(deadline)
  ? deadline
  : null;

// Sem data definida, cada visitante tem esta janela a partir do desbloqueio.
export const LICENSE_WINDOW_MINUTES = 10;

export const SIMULATION = {
  asset: "EUR/USD",
  assetName: "Euro / Dólar",
  assetIcon: "€",
  basePrice: 1.0852,
  priceDecimals: 5,
  startBalance: 100,
  payoutPercent: 87,
  analyzeMs: 4000,
  operateMs: 5000,
  resultMs: 4200,
};
