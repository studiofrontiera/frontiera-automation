import type { Lang, Scenario } from "../types.ts";

type Lead = {
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

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE = /\+?\d[\d\s().-]{7,}\d/;
const has = (t: string, words: string[]) => words.some((w) => t.includes(w));

const INTENT: Record<Lead["intent"], Record<Lang, string>> = {
  quote: { es: "solicitud de cotización", en: "quote request" },
  support: { es: "solicitud de soporte", en: "support request" },
  complaint: { es: "reclamo", en: "complaint" },
  meeting: { es: "solicitud de reunión", en: "meeting request" },
  other: { es: "consulta general", en: "general enquiry" },
};

export const lead: Scenario<Lead> = {
  id: "lead",
  label: { es: "Lead entrante", en: "Inbound lead" },
  blurb: {
    es: "Un correo de cliente se convierte en contacto, negocio y respuesta en el CRM.",
    en: "A customer e-mail becomes a contact, a deal and a reply in the CRM.",
  },
  sample: {
    es: "Hola, soy Carla Rojas de la empresa Ferretería Sur. Necesitamos cotizar con urgencia una automatización para la facturación: hoy pasamos a mano las órdenes de compra a Excel y luego al sistema contable. ¿Pueden llamarme mañana? Mi teléfono es +56 9 1234 5678 y mi correo carla@ferreteriasur.example.\n\nSaludos,\nCarla",
    en: "Hi, my name is Daniel Hayes from Northwind Supplies. We urgently need a quote to automate our invoicing: today we copy purchase orders into Excel by hand and then into our accounting system. Could you call me tomorrow? My phone is +1 415 555 0142 and my e-mail is daniel@northwind.example.\n\nThanks,\nDaniel",
  },
  nodes: [
    { kind: "trigger", title: { es: "Correo recibido", en: "E-mail received" }, tool: "Gmail" },
    { kind: "ai", title: { es: "IA extrae y clasifica", en: "AI extracts and classifies" }, tool: "OpenAI" },
    { kind: "rule", title: { es: "Router por urgencia", en: "Route by urgency" }, tool: "Router" },
    { kind: "action", title: { es: "Crear en CRM", en: "Create in CRM" }, tool: "HubSpot" },
  ],
  schema: {
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
  },
  grounded: { strings: ["email", "phone"], numbers: [] },
  prompt: {
    es: "Eres el paso de IA de un flujo de ventas de una pyme. Extrae solo datos presentes en el mensaje (si falta, null; nunca inventes). Clasifica intención y urgencia. Escribe un resumen de una frase, hasta 4 tareas concretas para el equipo y un borrador de respuesta breve y cordial en el idioma del mensaje, firmado 'El equipo'. No prometas precios ni plazos. No uses guiones largos.",
    en: "You are the AI step of a small business sales workflow. Extract only data present in the message (null when absent; never invent). Classify intent and urgency. Write a one-sentence summary, up to 4 concrete team tasks and a short, friendly draft reply in the message's language, signed 'The team'. Do not promise prices or timelines. Do not use long dashes.",
  },
  fields: [
    { key: "name", label: { es: "Nombre", en: "Name" } },
    { key: "company", label: { es: "Empresa", en: "Company" } },
    { key: "email", label: { es: "Correo", en: "E-mail" } },
    { key: "phone", label: { es: "Teléfono", en: "Phone" } },
    { key: "intent", label: { es: "Intención", en: "Intent" }, as: "badge" },
    { key: "urgency", label: { es: "Urgencia", en: "Urgency" }, as: "badge" },
    { key: "summary", label: { es: "Resumen", en: "Summary" }, as: "block" },
    { key: "tasks", label: { es: "Tareas", en: "Tasks" }, as: "list" },
    { key: "reply", label: { es: "Borrador de respuesta", en: "Draft reply" }, as: "block" },
  ],
  fallback(input, lang) {
    const t = input.toLowerCase();
    const name =
      input.match(/\b(?:[Ss]oy|[Mm]e llamo|[Mm]i nombre es|I am|I'm|[Mm]y name is)\s+(\p{Lu}\p{L}+(?:\s+\p{Lu}\p{L}+)?)/u)?.[1] ?? null;
    const company =
      input.match(/(?:de la empresa|empresa|from|at)\s+(\p{Lu}[\p{L}&. ]{1,40}?)(?=[,.\n])/u)?.[1]?.trim() ?? null;
    let intent: Lead["intent"] = "other";
    if (has(t, ["cotiz", "presupuesto", "precio", "quote", "pricing"])) intent = "quote";
    else if (has(t, ["reclamo", "inaceptable", "complaint", "refund", "devoluc"])) intent = "complaint";
    else if (has(t, ["no funciona", "error", "falla", "not working", "broken", "issue"])) intent = "support";
    else if (has(t, ["reunión", "reunion", "agendar", "meeting", "schedule"])) intent = "meeting";
    const urgency: Lead["urgency"] = has(t, ["urgente", "urgencia", "hoy", "mañana", "asap", "urgent", "today", "tomorrow"])
      ? "high"
      : has(t, ["semana", "pronto", "week", "soon"])
        ? "medium"
        : "low";
    const es = lang === "es";
    const first = name?.split(" ")[0];
    const label = INTENT[intent][lang];
    return {
      name,
      company,
      email: input.match(EMAIL)?.[0] ?? null,
      phone: input.match(PHONE)?.[0]?.trim() ?? null,
      intent,
      urgency,
      summary: es
        ? `${label[0].toUpperCase()}${label.slice(1)}${company ? ` de ${company}` : ""}.`
        : `${label[0].toUpperCase()}${label.slice(1)}${company ? ` from ${company}` : ""}.`,
      tasks: es
        ? ["Crear o actualizar el contacto en el CRM", intent === "quote" ? "Preparar cotización" : "Asignar responsable", "Responder al cliente"]
        : ["Create or update the CRM contact", intent === "quote" ? "Prepare a quote" : "Assign an owner", "Reply to the customer"],
      reply: es
        ? `Hola${first ? ` ${first}` : ""},\n\nGracias por escribirnos. Recibimos su ${label} y una persona del equipo le responderá a la brevedad con los siguientes pasos.\n\nSaludos,\nEl equipo`
        : `Hi${first ? ` ${first}` : ""},\n\nThank you for reaching out. We received your ${label} and someone on the team will get back to you shortly with next steps.\n\nBest regards,\nThe team`,
    };
  },
  decide(d, lang) {
    const es = lang === "es";
    const hot = d.urgency === "high" || d.intent === "complaint";
    return {
      outcome: hot ? "route:notify-now" : "route:queue",
      reason: hot
        ? es ? "Urgencia alta: se avisa a ventas de inmediato." : "High urgency: sales is notified right away."
        : es ? "Sin urgencia: entra a la cola del CRM." : "Not urgent: goes into the CRM queue.",
      checks: [
        { label: es ? "Tiene forma de contacto" : "Has a contact method", ok: !!(d.email || d.phone) },
        { label: es ? "Nombre identificado" : "Name identified", ok: !!d.name },
      ],
    };
  },
  payload(d, decision) {
    return {
      contact: { name: d.name, company: d.company, email: d.email, phone: d.phone },
      deal: { stage: "new", type: d.intent, priority: d.urgency },
      tasks: d.tasks,
      notify: decision.outcome === "route:notify-now" ? { channel: "#ventas", text: d.summary } : null,
      draft_reply: d.reply,
    };
  },
};
