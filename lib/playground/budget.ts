import "server-only";

/**
 * Best-effort spend guard for the public AI demo (per server instance, in memory):
 * - burst: at most N requests per IP per minute (hard error),
 * - daily per IP and daily per instance: AI calls beyond the cap run in rules mode instead.
 * The real ceiling is the monthly budget limit set in the OpenAI dashboard.
 */
const MINUTE = 60_000;
const DAY = 86_400_000;
const DAILY_PER_IP = Number(process.env.PLAYGROUND_DAILY_PER_IP) || 40;
const DAILY_TOTAL = Number(process.env.PLAYGROUND_DAILY_CAP) || 1500;

const burst = new Map<string, number[]>();
const daily = new Map<string, number>();
let dayStart = Date.now();
let total = 0;

function rollDay() {
  if (Date.now() - dayStart > DAY) {
    dayStart = Date.now();
    daily.clear();
    total = 0;
  }
}

export function clientIp(headers: Headers): string {
  return (headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
}

/** True when this IP sent more than `max` requests in the last minute. */
export function burstLimited(ip: string, max: number, bucket = "run"): boolean {
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (burst.get(key) ?? []).filter((t) => now - t < MINUTE);
  recent.push(now);
  burst.set(key, recent);
  if (burst.size > 5_000) burst.clear();
  return recent.length > max;
}

/** Reserves `cost` AI calls for this IP; false means "use rules mode". */
export function takeAi(ip: string, cost = 1): boolean {
  rollDay();
  const used = daily.get(ip) ?? 0;
  if (used + cost > DAILY_PER_IP || total + cost > DAILY_TOTAL) return false;
  daily.set(ip, used + cost);
  total += cost;
  if (daily.size > 20_000) daily.clear();
  return true;
}
