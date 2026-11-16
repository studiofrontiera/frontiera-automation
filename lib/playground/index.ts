import type { JsonObject, Lang, RunResult, Scenario } from "./types.ts";
import { lead } from "./scenarios/lead.ts";
import { invoice } from "./scenarios/invoice.ts";
import { support } from "./scenarios/support.ts";

export const SCENARIOS = [lead, invoice, support] as unknown as Scenario[];
export const MAX_INPUT = 2000;

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
  lang: Lang
): RunResult {
  const decision = scenario.decide(extracted, lang);
  return {
    scenario: scenario.id,
    mode,
    ms,
    trigger: { source: scenario.nodes[0].tool, chars: input.length, received_at: new Date().toISOString() },
    extracted,
    decision,
    payload: scenario.payload(extracted, decision),
  };
}
