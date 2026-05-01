import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import Script from "next/script";
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
        {/* Meta Pixel */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '2816366292049995');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=2816366292049995&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>

        {children}

        {/* Telegram channel tracker */}
        <Script
          src="https://track-production-cd03.up.railway.app/static/tracker.js"
          data-channel-id="6"
          data-channel-username="apollosemgale"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
