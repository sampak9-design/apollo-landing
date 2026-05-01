import Image from "next/image";
import { Suspense } from "react";
import ApolloLogo from "@/components/ApolloLogo";
import ParticleField from "@/components/ParticleField";
import TelegramButton from "@/components/TelegramButton";

const TELEGRAM_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_URL ?? "https://t.me/apollo_ia";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-apollo-dark">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/apollo-team.jpg"
          alt="Equipe Apollo"
          fill
          priority
          quality={90}
          className="object-cover object-center opacity-40"
          sizes="100vw"
        />
      </div>

      {/* Radial dark fade */}
      <div className="absolute inset-0 z-[1] bg-radial-fade" />

      {/* Animated grid */}
      <div className="absolute inset-0 z-[2] bg-grid opacity-30 animate-grid-move" />

      {/* Particle network */}
      <Suspense fallback={null}>
        <ParticleField />
      </Suspense>

      {/* Scanlines */}
      <div className="scanlines absolute inset-0 z-[11]" />

      {/* Top neon bar */}
      <div className="absolute top-0 left-0 right-0 z-20 h-px bg-gradient-to-r from-transparent via-apollo-cyan to-transparent opacity-70" />

      {/* Navbar */}
      <header className="relative z-30 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-6 lg:px-12">
        <ApolloLogo />
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
          <span className="text-[10px] font-medium uppercase tracking-widest text-green-400 sm:text-xs">
            Online
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-30 flex min-h-[calc(100vh-140px)] flex-col items-center justify-center px-4 py-8 text-center sm:px-6 sm:py-12">
        {/* Tag */}
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-apollo-cyan/30 bg-apollo-cyan/5 px-3 py-1.5 backdrop-blur-sm sm:mb-6 sm:px-4">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-apollo-cyan" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-apollo-cyan sm:text-xs">
            Inteligência Artificial · 2026
          </span>
        </div>

        {/* Headline */}
        <h1 className="mb-5 max-w-5xl font-display font-black uppercase leading-[1] tracking-tight sm:mb-6">
          <span className="block text-xl neon-text sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
            A IA que opera
          </span>
          <span className="my-1 block bg-gradient-to-r from-apollo-cyan via-apollo-blue to-apollo-cyan bg-clip-text text-5xl text-transparent drop-shadow-[0_0_30px_rgba(0,217,255,0.5)] sm:my-2 sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem]">
            por você
          </span>
          <span className="block text-xl neon-text sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
            no mercado em tempo real
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mb-8 max-w-2xl text-sm leading-relaxed text-white/70 sm:mb-12 sm:text-lg md:text-xl">
          Acesse a comunidade exclusiva da{" "}
          <span className="font-semibold text-apollo-cyan">Apollo IA</span> no
          Telegram e descubra como a inteligência artificial está mudando o
          futuro — em tempo real.
        </p>

        {/* CTA */}
        <TelegramButton href={TELEGRAM_URL} />

        {/* Trust line */}
        <p className="mt-6 text-[11px] uppercase tracking-widest text-white/40 sm:mt-8 sm:text-sm">
          + de <span className="text-apollo-cyan">15.000</span> membros ativos
        </p>

        {/* Stats grid */}
        <div className="mt-10 grid w-full max-w-3xl grid-cols-3 gap-3 border-t border-apollo-cyan/10 pt-6 sm:mt-16 sm:gap-4 sm:pt-10">
          <Stat label="Acesso" value="24/7" />
          <Stat label="Modelos IA" value="GPT-5+" />
          <Stat label="Comunidade" value="15K+" />
        </div>
      </section>

      {/* Bottom neon bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-px bg-gradient-to-r from-transparent via-apollo-blue to-transparent opacity-70" />

      {/* Footer */}
      <footer className="relative z-30 px-6 pb-6 text-center">
        <p className="text-xs uppercase tracking-widest text-white/30">
          © {new Date().getFullYear()} Apollo IA · Todos os direitos reservados
        </p>
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-display text-lg font-bold text-apollo-cyan neon-text sm:text-2xl md:text-3xl">
        {value}
      </span>
      <span className="mt-1 text-[10px] uppercase tracking-widest text-white/50 sm:text-xs">
        {label}
      </span>
    </div>
  );
}
