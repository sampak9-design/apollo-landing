"use client";

import { createContext, useContext } from "react";
import type { Lang } from "./langs";

const formatters = {
  pt: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
  es: new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }),
};

const DICT = {
  pt: {
    tag: "Inteligência Artificial · 2026",
    headline1: "A inteligência artificial",
    headline2: "que opera por você",
    subtitle: ["Faça uma", "operação", "e veja a", "em ação."],
    soundOn: "Ativar som",
    soundOff: "Desativar som",
    statusIdle: "Apollo IA monitorando o mercado",
    statusAnalyzing: "Analisando o mercado…",
    statusOperating: (buy: boolean) => `Operação de ${buy ? "compra" : "venda"} em andamento`,
    statusDone: "Operação finalizada",
    balance: "Saldo",
    start: "Iniciar operação com a IA",
    startCaption: "A Apollo IA analisa o gráfico e decide a entrada",
    analyzingTitle: "Apollo IA analisando o mercado…",
    steps: ["Lendo volume e liquidez", "Identificando tendência", "Definindo direção da entrada"],
    signal: "Sinal identificado",
    buyBig: "COMPRA ↑",
    sellBig: "VENDA ↓",
    operatingTitle: "Operação em andamento…",
    buySmall: "Compra ↑",
    sellSmall: "Venda ↓",
    entry: "entrada",
    partial: "Resultado parcial",
    resultTitle: "Operação finalizada",
    resultBalance: "Saldo:",
    continue: "Continuar →",
    unlocked: "Benefício desbloqueado",
    licenseTitle: (n: number | null) =>
      n ? `${n} licenças gratuitas da Apollo IA` : "Licença gratuita da Apollo IA",
    licenseText: "Você concluiu sua primeira operação e desbloqueou uma licença gratuita da Apollo IA.",
    cta: "Receber minha licença gratuita",
    commission: "Sua comissão:",
    availableFor: "Disponível por",
    expired: "Prazo desta liberação encerrado",
    units: { days: "dias", hours: "horas", min: "min", sec: "seg" },
    rights: "Todos os direitos reservados",
  },
  es: {
    tag: "Inteligencia Artificial · 2026",
    headline1: "La inteligencia artificial",
    headline2: "que opera por ti",
    subtitle: ["Haz una", "operación", "y mira a", "en acción."],
    soundOn: "Activar sonido",
    soundOff: "Desactivar sonido",
    statusIdle: "Apollo IA monitoreando el mercado",
    statusAnalyzing: "Analizando el mercado…",
    statusOperating: (buy: boolean) => `Operación de ${buy ? "compra" : "venta"} en curso`,
    statusDone: "Operación finalizada",
    balance: "Saldo",
    start: "Iniciar operación con la IA",
    startCaption: "Apollo IA analiza la gráfica y decide la entrada",
    analyzingTitle: "Apollo IA analizando el mercado…",
    steps: ["Leyendo volumen y liquidez", "Identificando tendencia", "Definiendo la dirección de entrada"],
    signal: "Señal identificada",
    buyBig: "COMPRA ↑",
    sellBig: "VENTA ↓",
    operatingTitle: "Operación en curso…",
    buySmall: "Compra ↑",
    sellSmall: "Venta ↓",
    entry: "entrada",
    partial: "Resultado parcial",
    resultTitle: "Operación finalizada",
    resultBalance: "Saldo:",
    continue: "Continuar →",
    unlocked: "Beneficio desbloqueado",
    licenseTitle: (n: number | null) =>
      n ? `${n} licencias gratuitas de Apollo IA` : "Licencia gratuita de Apollo IA",
    licenseText: "Completaste tu primera operación y desbloqueaste una licencia gratuita de Apollo IA.",
    cta: "Recibir mi licencia gratuita",
    commission: "Tu comisión:",
    availableFor: "Disponible por",
    expired: "El plazo de esta liberación terminó",
    units: { days: "días", hours: "horas", min: "min", sec: "seg" },
    rights: "Todos los derechos reservados",
  },
} satisfies Record<Lang, unknown>;

export type Dict = (typeof DICT)["pt"];
// Garante que o espanhol tem exatamente as mesmas chaves do português
const _sameKeys: Record<Lang, Dict> = DICT;
void _sameKeys;

type I18n = { lang: Lang; t: Dict; money: (value: number) => string };

export function makeI18n(lang: Lang): I18n {
  return { lang, t: DICT[lang], money: (v) => formatters[lang].format(v) };
}

export const I18nContext = createContext<I18n>(makeI18n("pt"));
export const useI18n = () => useContext(I18nContext);
