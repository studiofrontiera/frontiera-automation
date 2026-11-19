import "server-only";
import { RADAR_PROMPT, radarSchema, type RadarAnswer } from "./radar.ts";
import { conformObject } from "./playground/validate.ts";

const DEFAULT_MODEL = "gpt-5.6-luna";

/**
 * One Responses API call with web search and a strict JSON schema. Returns null on any failure
 * so the route can answer with a clear error instead of a made-up result.
 */
export async function askAssistant(qs: string[]): Promise<RadarAnswer[] | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
        store: false,
        max_output_tokens: 2500,
        tools: [{ type: "web_search" }],
        input: [
          { role: "system", content: [{ type: "input_text", text: RADAR_PROMPT }] },
          { role: "user", content: [{ type: "input_text", text: qs.map((q, i) => `${i + 1}. ${q}`).join("\n") }] },
        ],
        text: { format: { type: "json_schema", name: "radar", strict: true, schema: radarSchema } },
      }),
      signal: AbortSignal.timeout(55_000),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { error?: { code?: string; type?: string } } | null;
      console.error("radar_ai_error", res.status, err?.error?.code ?? err?.error?.type ?? "unknown");
      return null;
    }
    const body = (await res.json()) as { output_text?: string; output?: { type?: string; content?: { type?: string; text?: string }[] }[] };
    const raw = body.output_text ?? body.output?.flatMap((o) => o.content ?? []).find((c) => c.type === "output_text")?.text;
    if (!raw) return null;
    const data = conformObject(radarSchema, JSON.parse(raw));
    return data ? (data.answers as unknown as RadarAnswer[]) : null;
  } catch (e) {
    console.error("radar_ai_error", "exception", e instanceof Error ? e.name : "unknown");
    return null;
  }
}
