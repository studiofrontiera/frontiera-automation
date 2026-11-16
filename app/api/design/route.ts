import { NextResponse, type NextRequest } from "next/server";
import { MAX_DESIGN_INPUT, designFallback, designPrompt, designSchema, type Design } from "@/lib/playground/design";
import { structured } from "@/lib/playground/ai";
import { burstLimited, clientIp, takeAi } from "@/lib/playground/budget";
import type { Lang } from "@/lib/playground/types";

export const runtime = "nodejs";
export const maxDuration = 45;

const error = (code: string, status: number) =>
  NextResponse.json({ error: code }, { status, headers: status === 429 ? { "Retry-After": "60" } : undefined });

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (burstLimited(ip, 4, "design")) return error("rate_limited", 429);

  let body: { text?: unknown; lang?: unknown };
  try {
    body = await req.json();
  } catch {
    return error("bad_request", 400);
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (text.length < 20 || text.length > MAX_DESIGN_INPUT) return error("length_design", 400);
  const lang: Lang = body.lang === "en" ? "en" : "es";

  const started = Date.now();
  const ai = takeAi(ip, 2) ? ((await structured(designPrompt[lang], text, designSchema, "process_design", 1800)) as Design | null) : null;
  const design = ai && ai.steps.length >= 2 ? ai : designFallback(text, lang);
  return NextResponse.json(
    { mode: ai && ai.steps.length >= 2 ? "ai" : "rules", ms: Date.now() - started, design },
    { headers: { "Cache-Control": "no-store" } }
  );
}
