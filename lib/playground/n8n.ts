import type { JsonObject, Scenario, Settings } from "./types.ts";

/**
 * Builds an importable n8n workflow for a scenario: the same four steps as the playground.
 * Webhook -> build the OpenAI request -> OpenAI Responses (strict JSON schema) -> parse and
 * ground the answer -> rule node (deterministic, with the visitor's settings) -> respond.
 * The API key is never included: the HTTP node expects an "OpenAI header" credential.
 */

type N8nNode = {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: JsonObject;
  credentials?: JsonObject;
};

export const N8N_MODEL = "gpt-5.6-luna";

const code = (id: string, name: string, x: number, js: string): N8nNode => ({
  id,
  name,
  type: "n8n-nodes-base.code",
  typeVersion: 2,
  position: [x, 300],
  parameters: { mode: "runOnceForEachItem", jsCode: js },
});

export function toN8n(scenario: Scenario, settings: Settings, lang: "es" | "en") {
  const request = {
    model: N8N_MODEL,
    store: false,
    max_output_tokens: 1200,
    text: { format: { type: "json_schema", name: `frontiera_${scenario.id}`, strict: true, schema: scenario.schema } },
  };
  const names = {
    hook: "Webhook",
    build: "Build AI request",
    ai: "OpenAI: extract",
    parse: "Parse and ground",
    rule: "Rule: decide",
    reply: "Respond",
  };
  const nodes: N8nNode[] = [
    {
      id: "hook",
      name: names.hook,
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [0, 300],
      parameters: { httpMethod: "POST", path: `frontiera-${scenario.id}`, responseMode: "responseNode", options: {} },
    },
    code(
      "build",
      names.build,
      220,
      `// POST { "text": "..." } to the webhook.
const text = String($json.body?.text ?? "").slice(0, 4000);
const request = ${JSON.stringify(request)};
request.input = [
  { role: "system", content: [{ type: "input_text", text: ${JSON.stringify(scenario.prompt[lang])} }] },
  { role: "user", content: [{ type: "input_text", text }] },
];
return { text, request };`
    ),
    {
      id: "ai",
      name: names.ai,
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [440, 300],
      parameters: {
        method: "POST",
        url: "https://api.openai.com/v1/responses",
        authentication: "genericCredentialType",
        genericAuthType: "httpHeaderAuth",
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ JSON.stringify($json.request) }}",
        options: { timeout: 30000 },
      },
      credentials: { httpHeaderAuth: { id: "", name: "OpenAI header (Authorization: Bearer ...)" } },
    },
    code(
      "parse",
      names.parse,
      660,
      `// Parse the strict JSON answer, then ground it: values that are not in the input become null.
const text = $("${names.build}").item.json.text;
const raw = $json.output_text ?? ($json.output || []).flatMap((o) => o.content || []).find((c) => c.type === "output_text")?.text;
const data = JSON.parse(raw);
const lower = text.toLowerCase();
const digits = text.replace(/\\D/g, "");
for (const k of ${JSON.stringify(scenario.grounded.strings)}) {
  if (typeof data[k] === "string" && !lower.includes(data[k].toLowerCase())) data[k] = null;
}
for (const k of ${JSON.stringify(scenario.grounded.numbers)}) {
  if (typeof data[k] === "number" && !digits.includes(String(Math.trunc(data[k])).replace(/\\D/g, ""))) data[k] = null;
}
return { data };`
    ),
    code("rule", names.rule, 880, scenario.n8nRule(settings)),
    {
      id: "reply",
      name: names.reply,
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1.1,
      position: [1100, 300],
      parameters: { respondWith: "json", responseBody: "={{ JSON.stringify($json) }}", options: {} },
    },
  ];
  const order = [names.hook, names.build, names.ai, names.parse, names.rule, names.reply];
  const connections: JsonObject = {};
  for (let i = 0; i < order.length - 1; i++) {
    connections[order[i]] = { main: [[{ node: order[i + 1], type: "main", index: 0 }]] };
  }
  return {
    name: `FRONTIERA playground: ${scenario.label[lang]}`,
    nodes,
    connections,
    settings: { executionOrder: "v1" },
    meta: { source: "https://www.frontiera.cl/#playground" },
  };
}
