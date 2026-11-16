import { NextResponse, type NextRequest } from "next/server";
import { FILE_TYPES, MAX_FILE_BYTES, MAX_INPUT, complete, getScenario, sanitizeSettings } from "@/lib/playground";
import { aiConfigured, extractWithAi, readDocument } from "@/lib/playground/ai";
import { burstLimited, clientIp, takeAi } from "@/lib/playground/budget";
import type { Lang } from "@/lib/playground/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const error = (code: string, status: number) =>
  NextResponse.json({ error: code }, { status, headers: status === 429 ? { "Retry-After": "60" } : undefined });

type Body = { scenario?: unknown; text?: unknown; lang?: unknown; settings?: unknown; file?: { name?: unknown; type?: unknown; data?: unknown } };

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (burstLimited(ip, 8)) return error("rate_limited", 429);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return error("bad_request", 400);
  }

  const scenario = getScenario(body.scenario);
  if (!scenario) return error("bad_request", 400);
  const lang: Lang = body.lang === "en" ? "en" : "es";
  const settings = sanitizeSettings(scenario, body.settings);
  const started = Date.now();

  /* Document upload: the AI reads it first, then the normal workflow runs on the transcript. */
  if (body.file) {
    const { name, type, data } = body.file;
    if (!scenario.acceptsFiles || typeof type !== "string" || typeof data !== "string" || !(FILE_TYPES as readonly string[]).includes(type)) {
      return error("file_type", 400);
    }
    if (!data.startsWith(`data:${type};base64,`)) return error("file_type", 400);
    const bytes = Math.floor(((data.length - data.indexOf(",") - 1) * 3) / 4);
    if (bytes > MAX_FILE_BYTES) return error("file_size", 413);
    if (burstLimited(ip, 3, "file")) return error("rate_limited", 429);
    if (!aiConfigured() || !takeAi(ip, 2)) return error("file_needs_ai", 503);
    const transcript = await readDocument(data, type, typeof name === "string" ? name.slice(0, 80) : "document");
    if (!transcript) return error("file_unreadable", 422);
    const ai = await extractWithAi(scenario, transcript, lang);
    const extracted = ai ?? scenario.fallback(transcript, lang);
    const result = complete(scenario, transcript, extracted, ai ? "ai" : "rules", Date.now() - started, lang, settings);
    result.trigger = { ...result.trigger, source: "PDF / image", file: typeof name === "string" ? name.slice(0, 80) : "document" };
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (text.length < 10 || text.length > MAX_INPUT) return error("length", 400);

  const ai = takeAi(ip) ? await extractWithAi(scenario, text, lang) : null;
  const extracted = ai ?? scenario.fallback(text, lang);
  const result = complete(scenario, text, extracted, ai ? "ai" : "rules", Date.now() - started, lang, settings);

  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
