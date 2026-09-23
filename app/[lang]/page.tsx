import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SimulationExperience from "@/components/simulation/SimulationExperience";
import { LANGS } from "@/lib/langs";

// Só /pt e /mx existem; qualquer outro slug dá 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return LANGS.map((l) => ({ lang: l.slug }));
}

const META: Record<string, Metadata> = {
  pt: {
    title: "Apollo IA — O Futuro da Inteligência Artificial",
    description: "Faça uma operação e veja a Apollo IA em ação.",
  },
  mx: {
    title: "Apollo IA — El futuro de la Inteligencia Artificial",
    description: "Haz una operación y mira a Apollo IA en acción.",
    openGraph: { title: "Apollo IA", description: "La nueva era de la inteligencia artificial llegó.", locale: "es_MX" },
  },
};

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  return META[params.lang] ?? {};
}

export default function LangPage({ params }: { params: { lang: string } }) {
  const lang = LANGS.find((l) => l.slug === params.lang);
  if (!lang) notFound();
  return <SimulationExperience lang={lang.id} />;
}
