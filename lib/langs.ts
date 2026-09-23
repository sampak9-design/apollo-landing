// Idiomas e slugs de URL. Fica fora de i18n.tsx (client) para as rotas do
// servidor também poderem ler.
export type Lang = "pt" | "es";

export const LANGS: { id: Lang; slug: string; htmlLang: string }[] = [
  { id: "pt", slug: "pt", htmlLang: "pt-BR" },
  { id: "es", slug: "mx", htmlLang: "es-MX" },
];
