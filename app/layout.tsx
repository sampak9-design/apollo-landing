import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Apollo IA — O Futuro da Inteligência Artificial",
  description:
    "Entre na comunidade Apollo IA no Telegram e tenha acesso à inteligência artificial mais avançada do Brasil.",
  openGraph: {
    title: "Apollo IA",
    description: "A nova era da inteligência artificial chegou.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${orbitron.variable}`}>
      <body className="bg-apollo-dark text-white antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
