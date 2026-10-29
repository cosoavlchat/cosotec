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
  title: "CosoTec by CoSoAVL — GPS, DashCams y Seguridad",
  description:
    "Tienda en línea y cotizador oficial de CoSoAVL. Rastreo satelital, DashCams industriales, seguridad contra jammers y drones empresariales.",
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
