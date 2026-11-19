import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.frontiera.cl";
  return ["/", "/automatizacion", "/en", "/privacidad", "/en/privacy"].map((p) => ({ url: `${base}${p}`, changeFrequency: "monthly", priority: p.length < 4 ? 1 : 0.3 }));
}
