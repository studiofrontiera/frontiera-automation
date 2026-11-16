import { NextResponse, type NextRequest } from "next/server";
import { MAX_INPUT, complete, getScenario } from "@/lib/playground";
import { extractWithAi } from "@/lib/playground/ai";
import type { Lang } from "@/lib/playground/types";

export const runtime = "nodejs";
export const maxDuration = 30;

/* Best-effort per-instance limit; enough to stop casual abuse of the AI key. */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5_000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

const error = (code: string, status: number) =>
  NextResponse.json({ error: code }, { status, headers: status === 429 ? { "Retry-After": "60" } : undefined });

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (limited(ip)) return error("rate_limited", 429);

  let body: { scenario?: unknown; text?: unknown; lang?: unknown };
  try {
    body = await req.json();
  } catch {
    return error("bad_request", 400);
  }

  const scenario = getScenario(body.scenario);
  if (!scenario) return error("bad_request", 400);
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (text.length < 10 || text.length > MAX_INPUT) return error("length", 400);
  const lang: Lang = body.lang === "en" ? "en" : "es";

  const started = Date.now();
  const ai = await extractWithAi(scenario, text, lang);
  const extracted = ai ?? scenario.fallback(text, lang);
  const result = complete(scenario, text, extracted, ai ? "ai" : "rules", Date.now() - started, lang);

  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
