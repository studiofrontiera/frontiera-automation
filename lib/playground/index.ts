import type { JsonObject, Lang, RunResult, Scenario, Settings } from "./types.ts";
import { lead } from "./scenarios/lead.ts";
import { invoice } from "./scenarios/invoice.ts";
import { support } from "./scenarios/support.ts";

export const SCENARIOS = [lead, invoice, support] as unknown as Scenario[];
export const MAX_INPUT = 2000;

export const MAX_FILE_BYTES = 3 * 1024 * 1024;
export const FILE_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"] as const;

export function defaults(scenario: Scenario): Settings {
  return Object.fromEntries(scenario.settings.map((s) => [s.key, s.default]));
}

/** Keeps only known settings, clamped to their range; anything else falls back to the default. */
export function sanitizeSettings(scenario: Scenario, raw: unknown): Settings {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return Object.fromEntries(
    scenario.settings.map((s) => {
      const v = src[s.key];
      return [s.key, typeof v === "number" && Number.isFinite(v) ? Math.min(s.max, Math.max(s.min, v)) : s.default];
    })
  );
}

export function getScenario(id: unknown): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

/**
 * Runs the deterministic part of a workflow: given the extracted data (from the AI step or
 * the rule-based fallback), the rule node decides and the action node builds the payload.
 */
export function complete(
  scenario: Scenario,
  input: string,
  extracted: JsonObject,
  mode: RunResult["mode"],
  ms: number,
  lang: Lang,
  settings: Settings = defaults(scenario),
  source: string = input
): RunResult {
  const decision = scenario.decide(extracted, lang, settings);
  return {
    scenario: scenario.id,
    mode,
    source,
    ms,
    trigger: { source: scenario.nodes[0].tool, chars: input.length, received_at: new Date().toISOString() },
    extracted,
    decision,
    payload: scenario.payload(extracted, decision, settings),
  };
}
