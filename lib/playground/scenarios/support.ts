import type { Lang, Scenario } from "../types.ts";

type Ticket = {
  customer: string | null;
  email: string | null;
  orderId: string | null;
  category: "billing" | "technical" | "account" | "shipping" | "other";
  priority: "high" | "medium" | "low";
  sentiment: "negative" | "neutral" | "positive";
  summary: string;
  reply: string;
};

const TEAM: Record<Ticket["category"], Record<Lang, string>> = {
  billing: { es: "Facturación", en: "Billing" },
  technical: { es: "Soporte técnico", en: "Tech support" },
  account: { es: "Cuentas", en: "Accounts" },
  shipping: { es: "Despacho", en: "Shipping" },
  other: { es: "Atención general", en: "General" },
};
const SLA_HOURS: Record<Ticket["priority"], number> = { high: 2, medium: 8, low: 24 };
const has = (t: string, w: string[]) => w.some((x) => t.includes(x));

export const support: Scenario<Ticket> = {
  id: "support",
  label: { es: "Ticket de soporte", en: "Support ticket" },
  blurb: {
    es: "Un mensaje de cliente se clasifica, se asigna al equipo correcto con plazo y se responde.",
    en: "A customer message is classified, routed to the right team with a deadline and answered.",
  },
  sample: {
    es: "Hola, compré el pedido #A-20931 hace 10 días y todavía no llega. Ya escribí dos veces y nadie responde, la verdad estoy bastante molesto. Necesito saber hoy dónde está. Soy Tomás Fuentes, tomas.f@correo.example",
    en: "Hi, I bought order #A-20931 ten days ago and it still has not arrived. I have written twice and nobody answers, honestly I am quite upset. I need to know today where it is. Tom Fuller, tom.f@mail.example",
  },
  nodes: [
    { kind: "trigger", title: { es: "Mensaje de cliente", en: "Customer message" }, tool: "Helpdesk" },
    { kind: "ai", title: { es: "IA clasifica", en: "AI classifies" }, tool: "OpenAI" },
    { kind: "rule", title: { es: "Asignar equipo y plazo", en: "Assign team and SLA" }, tool: "Router" },
    { kind: "action", title: { es: "Crear ticket", en: "Create ticket" }, tool: "Zendesk / Slack" },
  ],
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["customer", "email", "orderId", "category", "priority", "sentiment", "summary", "reply"],
    properties: {
      customer: { type: ["string", "null"] },
      email: { type: ["string", "null"] },
      orderId: { type: ["string", "null"] },
      category: { type: "string", enum: ["billing", "technical", "account", "shipping", "other"] },
      priority: { type: "string", enum: ["high", "medium", "low"] },
      sentiment: { type: "string", enum: ["negative", "neutral", "positive"] },
      summary: { type: "string" },
      reply: { type: "string" },
    },
  },
  grounded: { strings: ["email", "orderId"], numbers: [] },
  prompt: {
    es: "Eres el paso de IA de una mesa de ayuda. Extrae solo datos presentes (si falta, null). Clasifica categoría, prioridad y sentimiento. Resume en una frase y redacta una respuesta empática y concreta en el idioma del mensaje, sin prometer plazos que no conoces, firmada 'El equipo'. No uses guiones largos.",
    en: "You are the AI step of a help desk. Extract only data present (null when absent). Classify category, priority and sentiment. Summarize in one sentence and draft an empathetic, concrete reply in the message's language, without promising timelines you do not know, signed 'The team'. Do not use long dashes.",
  },
  fields: [
    { key: "customer", label: { es: "Cliente", en: "Customer" } },
    { key: "email", label: { es: "Correo", en: "E-mail" } },
    { key: "orderId", label: { es: "Pedido", en: "Order" } },
    { key: "category", label: { es: "Categoría", en: "Category" }, as: "badge" },
    { key: "priority", label: { es: "Prioridad", en: "Priority" }, as: "badge" },
    { key: "sentiment", label: { es: "Sentimiento", en: "Sentiment" }, as: "badge" },
    { key: "summary", label: { es: "Resumen", en: "Summary" }, as: "block" },
    { key: "reply", label: { es: "Borrador de respuesta", en: "Draft reply" }, as: "block" },
  ],
  fallback(input, lang) {
    const t = input.toLowerCase();
    let category: Ticket["category"] = "other";
    if (has(t, ["pedido", "despacho", "llega", "envío", "order", "shipping", "arrived", "delivery"])) category = "shipping";
    else if (has(t, ["factura", "cobro", "pago", "invoice", "charge", "payment", "billing"])) category = "billing";
    else if (has(t, ["contraseña", "cuenta", "acceso", "password", "account", "login"])) category = "account";
    else if (has(t, ["error", "no funciona", "falla", "bug", "not working", "crash"])) category = "technical";
    const negative = has(t, ["molest", "enojad", "inaceptable", "pésimo", "upset", "angry", "terrible", "nadie responde", "nobody answers"]);
    const priority: Ticket["priority"] = has(t, ["hoy", "urgente", "today", "urgent", "asap"]) || negative ? "high" : "medium";
    const email = input.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
    const customer = input.match(/\b(?:[Ss]oy|[Mm]e llamo|I am|[Mm]y name is)\s+(\p{Lu}\p{L}+(?:\s+\p{Lu}\p{L}+)?)/u)?.[1] ?? null;
    const es = lang === "es";
    return {
      customer,
      email,
      orderId: input.match(/#\s?([A-Z0-9-]{4,})/i)?.[0] ?? null,
      category,
      priority,
      sentiment: negative ? "negative" : "neutral",
      summary: es ? `Caso de ${TEAM[category].es.toLowerCase()}, prioridad ${priority === "high" ? "alta" : "media"}.` : `${TEAM[category].en} case, ${priority} priority.`,
      reply: es
        ? `Hola${customer ? ` ${customer.split(" ")[0]}` : ""},\n\nLamentamos la demora y gracias por su paciencia. Su caso ya está asignado al equipo de ${TEAM[category].es.toLowerCase()}, que le escribirá con una respuesta concreta.\n\nSaludos,\nEl equipo`
        : `Hi${customer ? ` ${customer.split(" ")[0]}` : ""},\n\nWe are sorry for the delay and thank you for your patience. Your case is now assigned to our ${TEAM[category].en.toLowerCase()} team, who will get back to you with a concrete answer.\n\nBest regards,\nThe team`,
    };
  },
  decide(d, lang) {
    const es = lang === "es";
    const team = TEAM[d.category][lang];
    const sla = SLA_HOURS[d.priority];
    const escalate = d.sentiment === "negative" && d.priority === "high";
    return {
      outcome: `route:${d.category}${escalate ? ":escalate" : ""}`,
      reason: es
        ? `Asignado a ${team}, plazo ${sla} h${escalate ? ", con aviso al supervisor" : ""}.`
        : `Assigned to ${team}, SLA ${sla} h${escalate ? ", supervisor notified" : ""}.`,
      checks: [
        { label: es ? "Cliente identificable" : "Customer identifiable", ok: !!(d.email || d.customer) },
        { label: es ? "Referencia de pedido" : "Order reference", ok: !!d.orderId || d.category !== "shipping" },
        { label: es ? "Escalar a supervisor" : "Escalate to supervisor", ok: !escalate },
      ],
    };
  },
  payload(d, decision) {
    return {
      ticket: {
        requester: { name: d.customer, email: d.email },
        subject: d.summary,
        category: d.category,
        priority: d.priority,
        order_id: d.orderId,
        sla_hours: SLA_HOURS[d.priority],
        tags: [d.category, d.sentiment],
      },
      escalation: decision.outcome.endsWith(":escalate") ? { channel: "#soporte-supervisores" } : null,
      draft_reply: d.reply,
    };
  },
};
