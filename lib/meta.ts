import type { Metadata } from "next";
import type { Lang } from "./demo";
import { COPY } from "./copy";

export function homeMeta(lang: Lang): Metadata {
  const c = COPY[lang].meta;
  const url = lang === "es" ? "https://www.frontiera.cl/" : "https://www.frontiera.cl/en";
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: url, languages: { es: "https://www.frontiera.cl/", en: "https://www.frontiera.cl/en", "x-default": "https://www.frontiera.cl/" } },
    openGraph: { type: "website", siteName: "FRONTIERA", url, title: c.title, description: c.description, locale: lang === "es" ? "es_CL" : "en_US" },
    twitter: { card: "summary", title: c.title, description: c.description },
  };
}
