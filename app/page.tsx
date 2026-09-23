import SimulationExperience from "@/components/simulation/SimulationExperience";

// Página principal (português). Versões por idioma em app/[lang]: /pt e /mx.
// A página anterior está em app/antiga/page.tsx (rota /antiga) para voltar se precisar.
export default function Home() {
  return <SimulationExperience lang="pt" />;
}
