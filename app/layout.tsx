import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.frontiera.cl"),
  title: { default: "FRONTIERA | Automatización con IA", template: "%s" },
  applicationName: "FRONTIERA",
  icons: { icon: "/favicon.svg" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#07090d", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
