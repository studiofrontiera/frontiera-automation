import type { JsonObject, Scenario, Settings } from "./types.ts";
import { N8N_MODEL } from "./n8n.ts";

/**
 * Builds an importable Make (make.com) scenario blueprint for a playground scenario:
 * Webhook -> JSON-escape the text -> HTTP: OpenAI Responses (strict JSON schema) -> Parse JSON
 * -> Router whose filters are the scenario's rules (with the visitor's settings) -> Webhook response.
 * No key inside: the Authorization header holds a placeholder the user replaces.
 * Differences from the n8n export: no grounding step and no RUT check digit, because plain
 * Make filters cannot run code. The n8n export keeps both.
 */

export const MAKE_KEY_PLACEHOLDER = "Bearer YOUR_OPENAI_API_KEY";

const ids = { hook: 1, escape: 2, ai: 3, parse: 4, router: 5 };
const at = (x: number, y = 0) => ({ designer: { x, y } });

/** The model's JSON text inside the raw Responses API answer (the message is the last output item). */
const answer = `get(get(get(last(${ids.ai}.data.output); "content"); 1); "text")`;

export function toMake(scenario: Scenario, settings: Settings, lang: "es" | "en") {
  const request = {
    model: N8N_MODEL,
    store: false,
    max_output_tokens: 1200,
    input: [
      { role: "system", content: [{ type: "input_text", text: scenario.prompt[lang] }] },
      { role: "user", content: [{ type: "input_text", text: "__TEXT__" }] },
    ],
    text: { format: { type: "json_schema", name: `frontiera_${scenario.id}`, strict: true, schema: scenario.schema } },
  };
  /* The visitor's text arrives already JSON-encoded (with quotes) from the Transform to JSON module. */
  const body = JSON.stringify(request).replace('"__TEXT__"', `{{${ids.escape}.json}}`);

  const routes = scenario.makeRoutes(settings, (k) => `${ids.parse}.${k}`).map((r, i) => ({
    flow: [
      {
        id: 10 + i,
        module: "gateway:WebhookRespond",
        version: 1,
        parameters: {},
        filter: { name: `${r.outcome.replace(/\{\{.*?\}\}/g, "*")}: ${r.label}`, conditions: r.when },
        mapper: {
          status: "200",
          body: `{"outcome":"${r.outcome}","data":{{${answer}}}}`,
          headers: [{ key: "Content-Type", value: "application/json" }],
        },
        metadata: at(1200, i * 300 - 300),
      },
    ],
  }));

  const flow: JsonObject[] = [
    {
      id: ids.hook,
      module: "gateway:CustomWebHook",
      version: 1,
      parameters: { hook: null, maxResults: 1 },
      mapper: {},
      metadata: at(0),
    },
    {
      id: ids.escape,
      module: "json:TransformToJSON",
      version: 1,
      parameters: { space: "" },
      mapper: { object: `{{${ids.hook}.text}}` },
      metadata: at(300),
    },
    {
      id: ids.ai,
      module: "http:ActionSendData",
      version: 3,
      parameters: { handleErrors: false, useNewZLibDeCompress: true },
      mapper: {
        url: "https://api.openai.com/v1/responses",
        serializeUrl: false,
        method: "post",
        headers: [
          { name: "Authorization", value: MAKE_KEY_PLACEHOLDER },
          { name: "Content-Type", value: "application/json" },
        ],
        qs: [],
        bodyType: "raw",
        parseResponse: true,
        timeout: "60",
        shareCookies: false,
        rejectUnauthorized: true,
        followRedirect: true,
        useQuerystring: false,
        gzip: true,
        useMtls: false,
        contentType: "application/json",
        data: body,
        followAllRedirects: false,
      },
      metadata: at(600),
    },
    {
      id: ids.parse,
      module: "json:ParseJSON",
      version: 1,
      parameters: { type: "" },
      mapper: { json: `{{${answer}}}` },
      metadata: at(900),
    },
    {
      id: ids.router,
      module: "builtin:BasicRouter",
      version: 1,
      mapper: null,
      metadata: at(1050),
      routes,
    },
  ];

  return {
    name: `FRONTIERA playground: ${scenario.label[lang]}`,
    flow,
    metadata: {
      instant: true,
      version: 1,
      scenario: {
        roundtrips: 1,
        maxErrors: 3,
        autoCommit: true,
        autoCommitTriggerLast: true,
        sequential: false,
        confidential: false,
        dataloss: false,
        dlq: false,
        freshVariables: false,
      },
      designer: { orphans: [] },
    },
  };
}
