import "server-only";
import type { JsonObject, Lang, Scenario } from "./types.ts";
import { conformObject, ground } from "./validate.ts";

const DEFAULT_MODEL = "gpt-5.6-luna";

type ResponsesBody = { output_text?: string; output?: { content?: { type?: string; text?: string }[] }[] };

/**
 * The AI step: OpenAI Responses API with the scenario's strict JSON schema. Returns null
 * when no key is configured or anything fails, so the caller can fall back to rules.
 * The visitor's text is not stored (`store: false`) and is not logged here.
 */
export async function extractWithAi(scenario: Scenario, input: string, lang: Lang): Promise<JsonObject | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
        store: false,
        max_output_tokens: 1200,
        input: [
          { role: "system", content: [{ type: "input_text", text: scenario.prompt[lang] }] },
          { role: "user", content: [{ type: "input_text", text: input }] },
        ],
        text: { format: { type: "json_schema", name: `playground_${scenario.id}`, strict: true, schema: scenario.schema } },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as ResponsesBody;
    const raw = body.output_text ?? body.output?.flatMap((o) => o.content ?? []).find((c) => c.type === "output_text")?.text;
    if (!raw) return null;
    const data = conformObject(scenario.schema, JSON.parse(raw));
    return data ? ground(data, input, scenario.grounded) : null;
  } catch {
    return null;
  }
}
