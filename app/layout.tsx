import type { Metadata } from "next";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grupo IMC | Cargo · Box · Importadora",
  description: "Soluciones logísticas integrales: carga internacional, casilla en Miami y productos importados. Facilitando el comercio global desde Chile.",
  keywords: "IMC Cargo, IMC Box, Importadora IMC, logística Chile, carga internacional, casilla Miami, importación",
  openGraph: {
    title: "Grupo IMC | Cargo · Box · Importadora",
    description: "Soluciones logísticas integrales desde Chile al mundo.",
    url: "https://grupoimc.vercel.app",
    siteName: "Grupo IMC",
    locale: "es_CL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="bg-white text-gray-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
