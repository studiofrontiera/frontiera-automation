/**
 * Live demo: an incoming customer message becomes a structured lead, a CRM record and a
 * draft reply. The same shape is produced by the AI path and by the rule-based fallback,
 * so the interface never depends on which one answered.
 */

export type Lang = "es" | "en";

export type Lead = {
  name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  intent: "quote" | "support" | "complaint" | "meeting" | "other";
  urgency: "high" | "medium" | "low";
  summary: string;
  tasks: string[];
  reply: string;
};

export type DemoResult = { mode: "ai" | "rules"; lead: Lead; ms: number };

export const MAX_INPUT = 1500;

export const LEAD_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["name", "company", "email", "phone", "intent", "urgency", "summary", "tasks", "reply"],
  properties: {
    name: { type: ["string", "null"] },
    company: { type: ["string", "null"] },
    email: { type: ["string", "null"] },
    phone: { type: ["string", "null"] },
    intent: { type: "string", enum: ["quote", "support", "complaint", "meeting", "other"] },
    urgency: { type: "string", enum: ["high", "medium", "low"] },
    summary: { type: "string" },
    tasks: { type: "array", items: { type: "string" }, maxItems: 4 },
    reply: { type: "string" },
  },
} as const;

export function systemPrompt(lang: Lang): string {
  return lang === "es"
    ? "Eres el paso de IA de un flujo de automatización de ventas de una pyme. Recibes un mensaje entrante de un cliente. Extrae solo datos que aparezcan en el mensaje (si un dato no está, usa null; nunca inventes nombres, correos, teléfonos ni montos). Clasifica la intención y la urgencia. Escribe un resumen de una frase, hasta 4 tareas concretas para el equipo y un borrador de respuesta breve, cordial y profesional en el mismo idioma del mensaje, firmado como 'El equipo'. No prometas precios ni plazos que el mensaje no permita afirmar. No uses guiones largos."
    : "You are the AI step of a small business sales automation workflow. You receive an inbound customer message. Extract only data present in the message (use null when absent; never invent names, e-mails, phones or amounts). Classify intent and urgency. Write a one-sentence summary, up to 4 concrete tasks for the team and a short, friendly, professional draft reply in the message's language, signed 'The team'. Do not promise prices or timelines the message does not support. Do not use long dashes.";
}

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE = /(\+?\d[\d\s().-]{7,}\d)/;

const HAS = (text: string, words: string[]) => words.some((w) => text.includes(w));

/** Deterministic extraction used when no AI key is configured or the AI call fails. */
export function ruleBasedLead(input: string, lang: Lang): Lead {
  const text = input.toLowerCase();
  const email = input.match(EMAIL)?.[0] ?? null;
  const phone = input.match(PHONE)?.[0]?.trim() ?? null;

  const nameMatch =
    input.match(/(?:soy|me llamo|mi nombre es|i am|i'm|my name is)\s+([A-ZÁÉÍÓÚÑ][\p{L}]+(?:\s+[A-ZÁÉÍÓÚÑ][\p{L}]+)?)/u) ??
    input.match(/(?:saludos|atentamente|regards|thanks|gracias)[,.]?\s*\n\s*([A-ZÁÉÍÓÚÑ][\p{L}]+(?:\s+[A-ZÁÉÍÓÚÑ][\p{L}]+)?)/u);
  const companyMatch = input.match(/(?:de la empresa|empresa|from|at|company)\s+([A-Z][\p{L}&.\- ]{1,40}?)(?=[,.\n]|\s(?:y|and|we|nosotros|necesit|need)\b)/u);

  let intent: Lead["intent"] = "other";
  if (HAS(text, ["cotiz", "presupuesto", "precio", "quote", "pricing", "cost", "valor"])) intent = "quote";
  else if (HAS(text, ["reclamo", "molest", "inaceptable", "complaint", "refund", "devoluc"])) intent = "complaint";
  else if (HAS(text, ["no funciona", "error", "falla", "problema", "not working", "broken", "issue", "help"])) intent = "support";
  else if (HAS(text, ["reunión", "reunion", "llamada", "agendar", "meeting", "call", "schedule"])) intent = "meeting";

  const urgency: Lead["urgency"] = HAS(text, ["urgente", "hoy", "asap", "urgent", "today", "inmediato", "mañana", "tomorrow"])
    ? "high"
    : HAS(text, ["semana", "pronto", "week", "soon"])
      ? "medium"
      : "low";

  const es = lang === "es";
  const name = nameMatch?.[1] ?? null;
  const company = companyMatch?.[1]?.trim() ?? null;
  const label: Record<Lead["intent"], string> = es
    ? { quote: "solicitud de cotización", support: "solicitud de soporte", complaint: "reclamo", meeting: "solicitud de reunión", other: "consulta general" }
    : { quote: "quote request", support: "support request", complaint: "complaint", meeting: "meeting request", other: "general enquiry" };

  const tasks = es
    ? [
        "Crear o actualizar el contacto en el CRM",
        intent === "quote" ? "Preparar cotización con el alcance pedido" : "Asignar responsable del caso",
        urgency === "high" ? "Responder antes de 2 horas" : "Responder dentro del día hábil",
      ]
    : [
        "Create or update the contact in the CRM",
        intent === "quote" ? "Prepare a quote for the requested scope" : "Assign an owner to the case",
        urgency === "high" ? "Reply within 2 hours" : "Reply within one business day",
      ];

  const greet = name ? (es ? `Hola ${name.split(" ")[0]},` : `Hi ${name.split(" ")[0]},`) : es ? "Hola," : "Hi,";
  const reply = es
    ? `${greet}\n\nGracias por escribirnos. Recibimos su ${label[intent]} y ya está asignada a una persona del equipo, que le responderá a la brevedad con los siguientes pasos.\n\nSaludos,\nEl equipo`
    : `${greet}\n\nThank you for reaching out. We received your ${label[intent]} and it is already assigned to someone on the team, who will get back to you shortly with next steps.\n\nBest regards,\nThe team`;

  const summary = es
    ? `${label[intent][0].toUpperCase()}${label[intent].slice(1)}${company ? ` de ${company}` : ""}, urgencia ${urgency === "high" ? "alta" : urgency === "medium" ? "media" : "baja"}.`
    : `${label[intent][0].toUpperCase()}${label[intent].slice(1)}${company ? ` from ${company}` : ""}, ${urgency} urgency.`;

  return { name, company, email, phone, intent, urgency, summary, tasks, reply };
}

/** Keeps an AI answer inside the contract: known enums, bounded strings, no long dashes. */
export function sanitizeLead(raw: unknown, input: string, lang: Lang): Lead | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().replace(/\u2014/g, ",").slice(0, max) : null);
  const intents = ["quote", "support", "complaint", "meeting", "other"] as const;
  const urgencies = ["high", "medium", "low"] as const;
  const intent = intents.find((i) => i === r.intent);
  const urgency = urgencies.find((u) => u === r.urgency);
  const summary = str(r.summary, 300);
  const reply = str(r.reply, 1200);
  if (!intent || !urgency || !summary || !reply) return null;
  /* Contact data must literally appear in the message: the model may not invent it. */
  const present = (v: string | null) => (v && input.toLowerCase().includes(v.toLowerCase()) ? v : null);
  const tasks = Array.isArray(r.tasks) ? r.tasks.map((t) => str(t, 160)).filter((t): t is string => !!t).slice(0, 4) : [];
  return {
    name: str(r.name, 80),
    company: str(r.company, 80),
    email: present(str(r.email, 120)),
    phone: present(str(r.phone, 40)),
    intent,
    urgency,
    summary,
    tasks: tasks.length ? tasks : ruleBasedLead(input, lang).tasks,
    reply,
  };
}
