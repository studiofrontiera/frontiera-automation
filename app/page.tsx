import type { Metadata } from "next";
import { HomeIA } from "@/components/HomeIA";

export const metadata: Metadata = {
  title: "FRONTIERA · Su empresa dentro de la IA",
  description: "Haga que ChatGPT, Claude y Gemini recomienden su empresa. Radar IA gratis, diagnóstico, presencia y conectores para empresas B2B en Chile.",
  alternates: { canonical: "https://www.frontiera.cl/" },
};

export default function Page() {
  return <HomeIA />;
}
