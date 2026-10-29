import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cosotec.com"),
  title: {
    default: "CosoTec by CoSoAVL — GPS, DashCams y Seguridad Vehicular",
    template: "%s | CosoTec by CoSoAVL",
  },
  description:
    "Rastreo satelital GPS automotriz e industrial, DashCams inteligentes con IA y protección anti-jammer. Instalación profesional en 48–72 horas. CoSoAVL Metepec, Estado de México.",
  openGraph: {
    title: "CosoTec by CoSoAVL — GPS, DashCams y Seguridad Vehicular",
    description:
      "Venta e instalación de GPS, DashCams y seguridad para transporte. 48,000 dispositivos vendidos.",
    url: "https://cosotec.com",
    siteName: "CosoTec by CoSoAVL",
    locale: "es_MX",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX" className={`${manrope.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#F5F3F2] text-[#1C1C1E]">
        {children}
      </body>
    </html>
  );
}
