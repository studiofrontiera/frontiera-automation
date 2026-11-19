import type { ObjectSchema } from "./playground/types.ts";

/**
 * "Radar IA": asks an AI assistant (with web search) the questions a buyer would ask about a
 * service in a city, then measures whether a given company shows up. The model never sees the
 * company being measured, so it cannot favour it. Scoring is deterministic and happens here.
 */

export const RADAR_LIMITS = { field: 80 };

export function questions(rubro: string, ciudad: string): string[] {
  return [
    `¿Qué empresa recomiendas para ${rubro} en ${ciudad}?`,
    `¿Cuáles son las mejores empresas de ${rubro} en ${ciudad} para una pyme?`,
    `Necesito cotizar ${rubro} en ${ciudad}. ¿A quién contacto?`,
    `¿Qué proveedor de ${rubro} en ${ciudad} tiene buenas opiniones?`,
    `Compara las principales empresas de ${rubro} en ${ciudad}.`,
  ];
}

export const RADAR_PROMPT =
  "Actúas como un asistente de IA que responde a un usuario real en Chile. Para cada pregunta, usa la búsqueda web y nombra las empresas concretas que de verdad recomendarías (máximo 5 por pregunta), en el orden en que las recomendarías, con una razón de 12 palabras o menos. No inventes empresas: si no encuentras ninguna, deja la lista vacía. Responde en español.";

export const radarSchema: ObjectSchema = {
  type: "object",
  additionalProperties: false,
  required: ["answers"],
  properties: {
    answers: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "companies"],
        properties: {
          question: { type: "string" },
          companies: {
            type: "array",
            maxItems: 5,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "why"],
              properties: { name: { type: "string" }, why: { type: "string" } },
            },
          },
        },
      },
    },
  },
} as ObjectSchema;

export type RadarAnswer = { question: string; companies: { name: string; why: string }[] };
export type RadarResult = {
  company: string;
  rubro: string;
  ciudad: string;
  answers: (RadarAnswer & { hit: number | null })[];
  score: number;
  total: number;
  ranking: { name: string; count: number; you: boolean }[];
  fixes: string[];
  source: "ai" | "demo";
};

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/\b(spa|s\.?a\.?|ltda\.?|limitada|eirl|chile)\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/** True when two company names refer to the same company (loose, both directions). */
export function sameCompany(a: string, b: string): boolean {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  return x === y || (x.length >= 4 && y.includes(x)) || (y.length >= 4 && x.includes(y));
}

export function score(company: string, rubro: string, ciudad: string, answers: RadarAnswer[], source: RadarResult["source"]): RadarResult {
  const scored = answers.map((a) => {
    const i = a.companies.findIndex((c) => sameCompany(c.name, company));
    return { ...a, hit: i >= 0 ? i + 1 : null };
  });
  const counts = new Map<string, { name: string; count: number; you: boolean }>();
  for (const a of scored) {
    const seen = new Set<string>();
    for (const c of a.companies) {
      const you = sameCompany(c.name, company);
      const key = you ? "__you__" : norm(c.name);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const cur = counts.get(key) ?? { name: you ? company : c.name, count: 0, you };
      cur.count += 1;
      counts.set(key, cur);
    }
  }
  if (!counts.has("__you__")) counts.set("__you__", { name: company, count: 0, you: true });
  const ranking = [...counts.values()].sort((a, b) => b.count - a.count || Number(b.you) - Number(a.you)).slice(0, 6);
  if (!ranking.some((r) => r.you)) ranking[ranking.length - 1] = counts.get("__you__")!;
  const s = scored.filter((a) => a.hit !== null).length;
  return { company, rubro, ciudad, answers: scored, score: s, total: scored.length, ranking, fixes: fixesFor(s, scored.length), source };
}

export function fixesFor(s: number, total: number): string[] {
  if (s === 0)
    return [
      "Hoy la IA no lo nombra en ninguna respuesta: su competencia se queda con esas consultas.",
      "Publique hechos verificables que la IA pueda citar: qué hace, dónde, para quién, desde cuándo.",
      "Aparezca en las fuentes que la IA lee: ficha de Google, directorios del rubro, notas de prensa.",
    ];
  if (s < total)
    return [
      `Aparece en ${s} de ${total} respuestas: la IA lo conoce, pero no lo elige siempre.`,
      "Refuerce las preguntas donde no aparece con páginas de respuesta directa y comparaciones.",
      "Un conector permitiría que la IA consulte sus precios o disponibilidad y lo recomiende con datos.",
    ];
  return [
    `Aparece en las ${total} respuestas. El siguiente paso es que la IA pueda cotizar o reservar con usted.`,
    "Un conector propio convierte esa mención en una venta dentro del chat.",
  ];
}

/** Example shown before the first run and when no AI key is configured. Clearly fictitious. */
export const DEMO_COMPANY = "Grúas Andes";
export const DEMO_RUBRO = "arriendo de grúas horquilla";
export const RADAR_DEMO: RadarAnswer[] = questions(DEMO_RUBRO, "Santiago").map((q, i) => ({
  question: q,
  companies: [
    { name: "Elevadores Sur", why: "Flota grande y reseñas positivas" },
    { name: "GrúaMax", why: "Precios publicados y entrega en el día" },
    { name: "Montacargas Centro", why: "Atención a pymes" },
    ...(i === 4 ? [{ name: DEMO_COMPANY, why: "Aparece en un directorio del rubro" }] : []),
  ],
}));
