import "server-only";
import type { JsonObject, Lang, ObjectSchema, Scenario } from "./types.ts";
import { conformObject, ground } from "./validate.ts";

const DEFAULT_MODEL = "gpt-5.6-luna";

type ResponsesBody = { output_text?: string; output?: { content?: { type?: string; text?: string }[] }[] };
type Content = { type: "input_text"; text: string } | { type: "input_image"; image_url: string } | { type: "input_file"; filename: string; file_data: string };

export const aiConfigured = () => !!process.env.OPENAI_API_KEY;

/**
 * One call to the OpenAI Responses API. With a schema the answer is strict JSON; without it,
 * plain text. Returns null when no key is configured or anything fails, so callers can fall
 * back to rules. Requests use `store: false` and nothing is logged here.
 */
async function respond(system: string, user: Content[], opts: { schema?: ObjectSchema; name?: string; maxTokens: number }): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
        store: false,
        max_output_tokens: opts.maxTokens,
        input: [
          { role: "system", content: [{ type: "input_text", text: system }] },
          { role: "user", content: user },
        ],
        ...(opts.schema ? { text: { format: { type: "json_schema", name: opts.name ?? "out", strict: true, schema: opts.schema } } } : {}),
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as ResponsesBody;
    return body.output_text ?? body.output?.flatMap((o) => o.content ?? []).find((c) => c.type === "output_text")?.text ?? null;
  } catch {
    return null;
  }
}

/** Structured call: validated against the schema, null on any failure. */
export async function structured(system: string, text: string, schema: ObjectSchema, name: string, maxTokens = 1200): Promise<JsonObject | null> {
  const raw = await respond(system, [{ type: "input_text", text }], { schema, name, maxTokens });
  if (!raw) return null;
  try {
    return conformObject(schema, JSON.parse(raw));
  } catch {
    return null;
  }
}

/** The AI step of a scenario: strict schema, then grounding against the input text. */
export async function extractWithAi(scenario: Scenario, input: string, lang: Lang): Promise<JsonObject | null> {
  const data = await structured(scenario.prompt[lang], input, scenario.schema, `playground_${scenario.id}`);
  return data ? ground(data, input, scenario.grounded) : null;
}

const READ_PROMPT =
  "Transcribe this document to plain text exactly as written: every line, number, date and identifier, in the original language and order. Do not summarize, translate, correct or add anything. If a part is unreadable write [illegible]. Output only the transcription.";

/**
 * Reads an uploaded PDF or image into text. The scenario then runs on this transcript, and
 * grounding checks the extracted fields against it, so the decision is traceable to the page.
 */
export async function readDocument(dataUrl: string, mime: string, filename: string): Promise<string | null> {
  const part: Content = mime === "application/pdf" ? { type: "input_file", filename, file_data: dataUrl } : { type: "input_image", image_url: dataUrl };
  const text = await respond(READ_PROMPT, [part], { maxTokens: 1500 });
  const clean = text?.replace(/—/g, ",").trim();
  return clean && clean.length >= 10 ? clean.slice(0, 4000) : null;
}
