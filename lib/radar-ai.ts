import "server-only";
import { PROFILE_PROMPT, RADAR_PROMPT, profileInput, profileSchema, radarInput, radarSchema, type RadarAnswer, type RadarProfile } from "./radar.ts";
import { conformObject } from "./playground/validate.ts";
import type { ObjectSchema } from "./playground/types.ts";

const DEFAULT_MODEL = "gpt-5.6-luna";

/**
 * One Responses API call with web search and a strict JSON schema. Returns null on any failure
 * so the route can answer with a clear error instead of a made-up result.
 */
async function ask(name: string, system: string, user: string, schema: ObjectSchema, maxTokens: number): Promise<Record<string, unknown> | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
        store: false,
        max_output_tokens: maxTokens,
        tools: [{ type: "web_search" }],
        input: [
          { role: "system", content: [{ type: "input_text", text: system }] },
          { role: "user", content: [{ type: "input_text", text: user }] },
        ],
        text: { format: { type: "json_schema", name, strict: true, schema } },
      }),
      signal: AbortSignal.timeout(55_000),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { error?: { code?: string; type?: string } } | null;
      console.error(`${name}_ai_error`, res.status, err?.error?.code ?? err?.error?.type ?? "unknown");
      return null;
    }
    const body = (await res.json()) as { output_text?: string; output?: { type?: string; content?: { type?: string; text?: string }[] }[] };
    const raw = body.output_text ?? body.output?.flatMap((o) => o.content ?? []).find((c) => c.type === "output_text")?.text;
    if (!raw) return null;
    return conformObject(schema, JSON.parse(raw));
  } catch (e) {
    console.error(`${name}_ai_error`, "exception", e instanceof Error ? e.name : "unknown");
    return null;
  }
}

/** Buyer questions and answers. The company being measured is not in this prompt. */
export async function askAssistant(rubro: string, ciudad: string): Promise<RadarAnswer[] | null> {
  const data = await ask("radar", RADAR_PROMPT, radarInput(rubro, ciudad), radarSchema, 3000);
  return data ? (data.answers as unknown as RadarAnswer[]) : null;
}

/** What the AI knows about the company itself (separate call). */
export async function askProfile(company: string, web: string, ciudad: string): Promise<RadarProfile | null> {
  const data = await ask("profile", PROFILE_PROMPT, profileInput(company, web, ciudad), profileSchema, 800);
  if (!data) return null;
  const known = data.known === "si" && typeof data.description === "string" && data.description.length > 0;
  return { known, description: known ? String(data.description) : "" };
}
