import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COMPANY, DEMO_RUBRO, RADAR_DEMO, RADAR_LIMITS, questions, score } from "@/lib/radar";
import { askAssistant } from "@/lib/radar-ai";
import { aiConfigured } from "@/lib/playground/ai";
import { burstLimited, clientIp, takeAi } from "@/lib/playground/budget";

export const runtime = "nodejs";
export const maxDuration = 60;

const error = (code: string, status: number) => NextResponse.json({ error: code }, { status });
const field = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, RADAR_LIMITS.field) : "");

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (burstLimited(ip, 3, "radar")) return error("rate_limited", 429);
  let body: { company?: unknown; rubro?: unknown; ciudad?: unknown };
  try { body = await req.json(); } catch { return error("bad_request", 400); }
  const company = field(body.company), rubro = field(body.rubro), ciudad = field(body.ciudad) || "Santiago";
  if (company.length < 2 || rubro.length < 3) return error("length", 400);

  if (!aiConfigured()) return NextResponse.json(score(DEMO_COMPANY, DEMO_RUBRO, "Santiago", RADAR_DEMO, "demo"));
  /* A radar run costs about as much as several playground runs. */
  if (!takeAi(ip, 4)) return error("daily_limit", 429);
  const answers = await askAssistant(questions(rubro, ciudad));
  if (!answers) return error("ai_unavailable", 503);
  return NextResponse.json(score(company, rubro, ciudad, answers, "ai"), { headers: { "Cache-Control": "no-store" } });
}
