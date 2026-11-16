import type { Bi, JsonObject, Lang, ObjectSchema } from "./types.ts";

/**
 * "Describe your process": the visitor writes how a task is done today and the AI drafts an
 * automation for it, as the same trigger -> AI -> rule -> action chain the playground runs.
 * It is a first draft for a conversation, not a quote: no prices, no promised savings.
 */

export const MAX_DESIGN_INPUT = 1500;

export type StepKind = "trigger" | "ai" | "rule" | "action" | "human";

export type Design = {
  title: string;
  summary: string;
  steps: { kind: StepKind; title: string; tool: string; detail: string }[];
  data: string[];
  rules: string[];
  risks: string[];
  questions: string[];
};

export const designSchema: ObjectSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "steps", "data", "rules", "risks", "questions"],
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    steps: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "title", "tool", "detail"],
        properties: {
          kind: { type: "string", enum: ["trigger", "ai", "rule", "action", "human"] },
          title: { type: "string" },
          tool: { type: "string" },
          detail: { type: "string" },
        },
      },
    },
    data: { type: "array", items: { type: "string" }, maxItems: 10 },
    rules: { type: "array", items: { type: "string" }, maxItems: 6 },
    risks: { type: "array", items: { type: "string" }, maxItems: 4 },
    questions: { type: "array", items: { type: "string" }, maxItems: 4 },
  },
};

export const designPrompt: Bi = {
  es: "Eres un arquitecto de automatización de procesos para pymes. El usuario describe cómo hace hoy una tarea. Diseña una automatización concreta y realista como cadena de 4 a 8 pasos: empieza con un disparador; usa pasos 'ai' solo para leer, clasificar o redactar; las decisiones van en pasos 'rule' con criterios explícitos; agrega un paso 'human' donde una persona debe aprobar algo con dinero, contratos o datos sensibles; termina con acciones en sistemas. Herramientas: nombra apps reales (Gmail, Outlook, WhatsApp Business, Google Sheets, Excel, HubSpot, Pipedrive, Salesforce, Slack, Teams, Notion, Drive, SII, Make, n8n, Zapier, OpenAI, Claude) y si no sabes cuál usa, escribe un genérico como 'su CRM'. Lista los datos que se extraen, las reglas de decisión, riesgos reales y hasta 4 preguntas que harías al cliente. No inventes precios, plazos ni porcentajes de ahorro. Responde en español, frases cortas, sin guiones largos. Si el texto no describe un proceso de negocio, diseña la automatización más cercana razonable y dilo en el resumen.",
  en: "You are a business process automation architect for small and mid-size companies. The user describes how a task is done today. Design a concrete, realistic automation as a chain of 4 to 8 steps: start with a trigger; use 'ai' steps only to read, classify or draft; decisions go in 'rule' steps with explicit criteria; add a 'human' step where a person must approve anything involving money, contracts or sensitive data; end with actions in systems. Tools: name real apps (Gmail, Outlook, WhatsApp Business, Google Sheets, Excel, HubSpot, Pipedrive, Salesforce, Slack, Teams, Notion, Drive, QuickBooks, Make, n8n, Zapier, OpenAI, Claude) and when unknown write a generic one like 'your CRM'. List the extracted data, decision rules, real risks and up to 4 questions you would ask the client. Do not invent prices, timelines or savings percentages. Answer in English, short sentences, no long dashes. If the text is not a business process, design the closest reasonable automation and say so in the summary.",
};

export const designSamples: Record<Lang, string[]> = {
  es: [
    "Cada lunes alguien descarga las ventas de la semana de nuestra tienda Shopify, las pega en un Excel, arma un resumen por producto y lo manda por correo al gerente.",
    "Los candidatos postulan por correo con su CV en PDF. Una persona los lee, anota en una planilla si cumplen requisitos y agenda entrevistas por WhatsApp.",
    "Recibimos órdenes de compra por correo de 20 clientes, las digitamos en el sistema y avisamos a bodega para despachar.",
  ],
  en: [
    "Every Monday someone exports last week's sales from our Shopify store, pastes them into Excel, builds a summary by product and e-mails it to the manager.",
    "Candidates apply by e-mail with a PDF resume. Someone reads each one, notes in a spreadsheet whether they qualify and books interviews by WhatsApp.",
    "We receive purchase orders by e-mail from 20 customers, type them into our system and tell the warehouse to ship.",
  ],
};

const has = (t: string, w: string[]) => w.some((x) => t.includes(x));

/** Without the AI, a generic but honest skeleton based on keywords. */
export function designFallback(input: string, lang: Lang): Design {
  const t = input.toLowerCase();
  const es = lang === "es";
  const source = has(t, ["whatsapp"]) ? "WhatsApp Business" : has(t, ["formulario", "form"]) ? "Typeform / Google Forms" : has(t, ["shopify", "tienda", "store"]) ? "Shopify" : has(t, ["excel", "planilla", "sheet"]) ? "Google Sheets" : "Gmail / Outlook";
  const target = has(t, ["crm", "hubspot", "pipedrive", "cliente", "customer"]) ? (es ? "su CRM" : "your CRM") : has(t, ["contab", "factura", "invoice", "account"]) ? (es ? "su sistema contable" : "your accounting system") : "Google Sheets";
  const money = has(t, ["pago", "factura", "orden", "compra", "payment", "invoice", "order", "contrato", "contract"]);
  const steps: Design["steps"] = [
    { kind: "trigger", title: es ? "Llega un nuevo caso" : "A new item arrives", tool: source, detail: es ? "El flujo parte solo cuando entra el dato." : "The flow starts on its own when data comes in." },
    { kind: "ai", title: es ? "IA extrae los datos" : "AI extracts the data", tool: "OpenAI / Claude", detail: es ? "Lee el texto o documento y devuelve campos con formato fijo." : "Reads the text or document and returns fields in a fixed format." },
    { kind: "rule", title: es ? "Reglas validan y deciden" : "Rules check and decide", tool: "Make / n8n", detail: es ? "Campos obligatorios, montos y a quién va cada caso." : "Required fields, amounts and who gets each case." },
    ...(money ? [{ kind: "human" as const, title: es ? "Aprobación de una persona" : "A person approves", tool: "Slack / Teams", detail: es ? "Solo en casos sobre el límite o con datos dudosos." : "Only above the limit or when data looks wrong." }] : []),
    { kind: "action", title: es ? "Registrar y avisar" : "Record and notify", tool: target, detail: es ? "Se guarda el resultado y se avisa al responsable." : "The result is stored and the owner is notified." },
  ];
  return {
    title: es ? "Borrador de automatización" : "Automation draft",
    summary: es ? "Esquema base generado por reglas (la IA no está disponible ahora). En el diagnóstico se ajusta a su proceso real." : "Base outline generated by rules (the AI is not available right now). In the diagnosis it is adapted to your real process.",
    steps,
    data: es ? ["Origen del caso", "Datos clave del texto", "Responsable"] : ["Source of the item", "Key data from the text", "Owner"],
    rules: es ? ["Si falta un dato obligatorio, va a revisión"] : ["If a required field is missing, it goes to review"],
    risks: es ? ["Datos de entrada con formatos distintos"] : ["Input data in different formats"],
    questions: es ? ["¿Cuántos casos al mes?", "¿Qué sistemas usan hoy?"] : ["How many items a month?", "Which systems do you use today?"],
  };
}

/** A design as an n8n workflow skeleton: one placeholder node per step plus a sticky note. */
export function designToN8n(d: Design, lang: Lang) {
  const nodes: JsonObject[] = d.steps.map((s, i) => ({
    id: `s${i}`,
    name: `${i + 1}. ${s.title}`.slice(0, 60),
    type: i === 0 ? "n8n-nodes-base.manualTrigger" : "n8n-nodes-base.noOp",
    typeVersion: 1,
    position: [i * 240, 300],
    parameters: {},
    notes: `${s.kind.toUpperCase()} · ${s.tool}\n${s.detail}`,
    notesInFlow: true,
  }));
  nodes.push({
    id: "note",
    name: "Sticky Note",
    type: "n8n-nodes-base.stickyNote",
    typeVersion: 1,
    position: [0, 0],
    parameters: {
      width: Math.max(480, d.steps.length * 240),
      height: 220,
      content: `## ${d.title}\n${d.summary}\n\n**${lang === "es" ? "Reglas" : "Rules"}:** ${d.rules.join("; ")}\n\nfrontiera.cl`,
    },
  });
  const connections: JsonObject = {};
  for (let i = 0; i < d.steps.length - 1; i++) {
    connections[nodes[i].name as string] = { main: [[{ node: nodes[i + 1].name as string, type: "main", index: 0 }]] };
  }
  return { name: `FRONTIERA draft: ${d.title}`.slice(0, 80), nodes, connections, settings: { executionOrder: "v1" } };
}
