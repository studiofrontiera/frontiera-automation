import { NextResponse, type NextRequest } from "next/server";
import { LEAD_SCHEMA, MAX_INPUT, ruleBasedLead, sanitizeLead, systemPrompt, type DemoResult, type Lang } from "@/lib/demo";

/**
 * Live demo endpoint. The visitor's text is sent to the model only to produce the demo
 * answer: nothing is stored or logged (`store: false`, no persistence here).
 */

export const runtime = "nodejs";
export const maxDuration = 30;

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 6;
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

async function aiLead(input: string, lang: Lang) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      store: false,
      max_output_tokens: 900,
      input: [
        { role: "system", content: [{ type: "input_text", text: systemPrompt(lang) }] },
        { role: "user", content: [{ type: "input_text", text: input }] },
      ],
      text: { format: { type: "json_schema", name: "inbound_lead", strict: true, schema: LEAD_SCHEMA } },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { output_text?: string; output?: { content?: { type?: string; text?: string }[] }[] };
  const raw = body.output_text ?? body.output?.flatMap((o) => o.content ?? []).find((c) => c.type === "output_text")?.text;
  if (!raw) return null;
  try {
    return sanitizeLead(JSON.parse(raw), input, lang);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (limited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": "60" } });

  let payload: { text?: unknown; lang?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  const lang: Lang = payload.lang === "en" ? "en" : "es";
  if (text.length < 10 || text.length > MAX_INPUT) return NextResponse.json({ error: "length" }, { status: 400 });

  const started = Date.now();
  let lead = null;
  try {
    lead = await aiLead(text, lang);
  } catch {
    lead = null;
  }
  const result: DemoResult = lead
    ? { mode: "ai", lead, ms: Date.now() - started }
    : { mode: "rules", lead: ruleBasedLead(text, lang), ms: Date.now() - started };
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
