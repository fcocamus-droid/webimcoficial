import type { Metadata } from "next";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "IMC Industriales · Marketplace B2B Chile",
  description:
    "Conectamos fabricantes e importadores chilenos con compradores empresariales. Químicos, cosmética, limpieza, alimentos, suplementos y packaging.",
  keywords:
    "B2B Chile, marketplace industrial, fabricantes Chile, importadores Chile, químicos industriales, RFQ, cotización industrial",
  openGraph: {
    title: "IMC Industriales · Marketplace B2B Chile",
    description:
      "El marketplace B2B industrial de Chile. Sin intermediarios, conexión directa fabricante–comprador.",
    siteName: "IMC Industriales",
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
