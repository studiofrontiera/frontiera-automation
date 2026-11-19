import type { ObjectSchema } from "./playground/types.ts";

/**
 * Free "Diagnóstico IA": a buyer asks an AI assistant (with web search) three questions about what
 * the company sells, in its city. The model writing those answers never sees the company being
 * measured, so it cannot favour it. A second, separate search checks what the AI knows about the
 * company itself. Scoring is deterministic and happens here.
 */

export const RADAR_LIMITS = { field: 80, web: 120 };
export const RADAR_QUESTIONS = 3;

/** Fallback wording, used for the demo. The live run lets the model phrase real buyer questions. */
export function questions(rubro: string, ciudad: string): string[] {
  return [
    `Quiero comprar ${rubro} en ${ciudad}. ¿Dónde me recomiendas?`,
    `¿Cuáles son las empresas más conocidas de ${rubro} en ${ciudad}?`,
    `¿A quién le pido una cotización de ${rubro} en ${ciudad}?`,
  ];
}

export const RADAR_PROMPT = [
  "Actúas como un asistente de IA que responde a un cliente real en Chile.",
  `Recibes un rubro (lo que una empresa vende) y una ciudad. Primero escribe ${RADAR_QUESTIONS} preguntas cortas y naturales, como las escribiría un cliente que quiere COMPRAR o CONTRATAR eso en esa ciudad: una pidiendo una recomendación, una pidiendo las empresas más conocidas o grandes del rubro, y una pidiendo a quién cotizar o comprar.`,
  "El cliente es quien compra ese producto o servicio, no alguien que quiere montar ese negocio: no recomiendes software, agencias ni proveedores para crear ese negocio, salvo que el rubro sea justamente eso.",
  "Luego responde cada pregunta usando la búsqueda web, como lo harías de verdad: nombra las empresas concretas que recomendarías (máximo 5), en orden, incluidas las grandes y conocidas si corresponde.",
  "Para cada empresa: nombre comercial, su dominio web si lo conoces (por ejemplo empresa.cl, sin https) o vacío, y una razón de 12 palabras o menos, en texto simple, sin enlaces ni markdown.",
  "No inventes empresas. Responde en español.",
].join(" ");

export const radarInput = (rubro: string, ciudad: string) => `Rubro: ${rubro}\nCiudad: ${ciudad}`;

const companySchema = {
  type: "object",
  additionalProperties: false,
  required: ["name", "web", "why"],
  properties: { name: { type: "string" }, web: { type: "string" }, why: { type: "string" } },
};

export const radarSchema: ObjectSchema = {
  type: "object",
  additionalProperties: false,
  required: ["answers"],
  properties: {
    answers: {
      type: "array",
      maxItems: RADAR_QUESTIONS,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "companies"],
        properties: { question: { type: "string" }, companies: { type: "array", maxItems: 5, items: companySchema } },
      },
    },
  },
} as ObjectSchema;

export const PROFILE_PROMPT =
  "Actúas como un asistente de IA. Te preguntan por una empresa concreta de Chile. Usa la búsqueda web. Si la encuentras con información fiable, known='si' y describe en una sola frase de máximo 25 palabras qué vende y a quién, tal como se lo explicarías a un cliente, en texto simple sin enlaces. Si no encuentras información fiable, known='no' y description vacía. No inventes. Responde en español.";

export const profileSchema: ObjectSchema = {
  type: "object",
  additionalProperties: false,
  required: ["known", "description"],
  properties: { known: { type: "string", enum: ["si", "no"] }, description: { type: "string" } },
} as ObjectSchema;

export const profileInput = (company: string, web: string, ciudad: string) =>
  `¿Qué sabes de la empresa ${company}${web ? ` (${web})` : ""}, de ${ciudad}, Chile?`;

export type RadarCompany = { name: string; why: string; web?: string };
export type RadarAnswer = { question: string; companies: RadarCompany[] };
export type RadarProfile = { known: boolean; description: string };
export type RadarResult = {
  company: string;
  web: string;
  rubro: string;
  ciudad: string;
  answers: (RadarAnswer & { hit: number | null })[];
  score: number;
  total: number;
  ranking: { name: string; count: number; you: boolean }[];
  rival: string | null;
  profile: RadarProfile | null;
  fixes: string[];
  source: "ai" | "demo";
};

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/\b(spa|s\.?a\.?|ltda\.?|limitada|eirl|chile|www|com|cl)\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/** True when two company names refer to the same company (loose, both directions). */
export function sameCompany(a: string, b: string): boolean {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  return x === y || (x.length >= 4 && y.includes(x)) || (y.length >= 4 && x.includes(y));
}

/** Registrable part of a domain: "https://www.falabella.com/falabella-cl" -> "falabella". */
export function domainKey(web: string): string {
  const host = web.trim().toLowerCase().replace(/^[a-z]+:\/\//, "").split(/[/?#]/)[0].replace(/^www\./, "");
  const parts = host.split(".").filter(Boolean);
  if (parts.length < 2) return "";
  const sld = ["com", "co", "gob", "gov", "org", "net"].includes(parts[parts.length - 2]) && parts.length >= 3 ? parts[parts.length - 3] : parts[parts.length - 2];
  return sld.length >= 3 ? sld : "";
}

const isYou = (c: RadarCompany, company: string, web: string) => {
  if (sameCompany(c.name, company)) return true;
  const mine = domainKey(web);
  return !!mine && !!c.web && domainKey(c.web) === mine;
};

/** Models sometimes paste citations into the reason; keep plain text only. */
export const cleanWhy = (s: string) =>
  s.replace(/\(?\[([^\]]*)\]\([^)]*\)\)?/g, "").replace(/https?:\/\/\S+/g, "").replace(/[*_`]/g, "").replace(/\s+([.,;])/g, "$1").replace(/\s{2,}/g, " ").trim().replace(/[.,;:]$/, "");

export function score(
  company: string, rubro: string, ciudad: string, answers: RadarAnswer[], source: RadarResult["source"],
  opts: { web?: string; profile?: RadarProfile | null } = {},
): RadarResult {
  const web = opts.web ?? "";
  const scored = answers.slice(0, RADAR_QUESTIONS).map((a) => {
    const companies = a.companies.map((c) => ({ ...c, why: cleanWhy(c.why) }));
    const i = companies.findIndex((c) => isYou(c, company, web));
    return { question: a.question, companies, hit: i >= 0 ? i + 1 : null };
  });
  const counts = new Map<string, { name: string; count: number; you: boolean; best: number }>();
  for (const a of scored) {
    const seen = new Set<string>();
    a.companies.forEach((c, pos) => {
      const you = isYou(c, company, web);
      const key = you ? "__you__" : norm(c.name);
      if (!key || seen.has(key)) return;
      seen.add(key);
      const cur = counts.get(key) ?? { name: you ? company : c.name, count: 0, you, best: 99 };
      cur.count += 1;
      cur.best = Math.min(cur.best, pos);
      counts.set(key, cur);
    });
  }
  if (!counts.has("__you__")) counts.set("__you__", { name: company, count: 0, you: true, best: 99 });
  const sorted = [...counts.values()].sort((a, b) => b.count - a.count || a.best - b.best || Number(b.you) - Number(a.you));
  const ranking = sorted.slice(0, 6);
  if (!ranking.some((r) => r.you)) ranking[ranking.length - 1] = counts.get("__you__")!;
  const rival = sorted.find((r) => !r.you)?.name ?? null;
  const s = scored.filter((a) => a.hit !== null).length;
  const profile = opts.profile ?? null;
  return {
    company, web, rubro, ciudad, answers: scored, score: s, total: scored.length,
    ranking: ranking.map(({ name, count, you }) => ({ name, count, you })),
    rival, profile, fixes: fixesFor(s, scored.length, profile), source,
  };
}

export function fixesFor(s: number, total: number, profile: RadarProfile | null): string[] {
  const out: string[] = [];
  if (profile && !profile.known) out.push("La IA no encuentra información fiable de su empresa: primero hay que darle hechos que pueda citar.");
  if (s === 0) {
    out.push("En ninguna respuesta lo recomienda: hoy esas consultas se las lleva su competencia.");
    out.push("Publicar qué vende, dónde, a quién y a qué precio en las fuentes que la IA lee.");
  } else if (s < total) {
    out.push(`Lo recomienda en ${s} de ${total} respuestas: lo conoce, pero no lo elige siempre.`);
    out.push("Reforzar las preguntas donde no aparece con respuestas directas y comparaciones.");
  } else {
    out.push(`Lo recomienda en las ${total} respuestas: está listo para vender dentro del chat.`);
  }
  out.push("Con un conector propio, la IA consulta sus precios y stock y cotiza con usted, no con otro.");
  return out.slice(0, 3);
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
    ...(i === 2 ? [{ name: DEMO_COMPANY, why: "Aparece en un directorio del rubro" }] : []),
  ],
}));
export const DEMO_PROFILE: RadarProfile = { known: false, description: "" };

export type NextStep = { tier: "visible" | "partial" | "invisible"; title: string; text: string; product: string; price: string; cta: string };

/** The diagnosis picks the product: invisible companies need presence, visible ones need to sell in the chat. */
export function nextStep(r: Pick<RadarResult, "score" | "total" | "profile" | "rival" | "company">): NextStep {
  const known = r.profile?.known ?? false;
  if (r.total > 0 && r.score === r.total && known)
    return {
      tier: "visible",
      title: "La IA ya lo recomienda. Ahora, que venda por usted.",
      text: `Hoy la IA nombra a ${r.company} y manda al cliente a su sitio, donde se pierde. Con un conector propio, la IA consulta su catálogo, precio y stock y cierra la cotización dentro del chat.`,
      product: "Conector propio", price: "desde USD 2.500", cta: "Quiero vender dentro del chat",
    };
  if (r.score > 0)
    return {
      tier: "partial",
      title: `Lo conoce, pero ${r.total - r.score} de ${r.total} clientes se van${r.rival ? ` con ${r.rival}` : ""}.`,
      text: "Hay que darle a la IA las razones para elegirlo siempre: datos claros, comparaciones y presencia en las fuentes que lee. Y medirlo cada mes.",
      product: "Presencia IA", price: "USD 900 + USD 150 al mes", cta: "Quiero que me elija siempre",
    };
  return {
    tier: "invisible",
    title: "Para la IA, su empresa no existe.",
    text: `Cada cliente que pregunta hoy termina${r.rival ? ` en ${r.rival}` : " en su competencia"}. Primero hay que ponerlo en las fuentes que la IA lee, con hechos que pueda citar.`,
    product: "Presencia IA", price: "USD 900 + USD 150 al mes", cta: "Quiero aparecer en la IA",
  };
}
