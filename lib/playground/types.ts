/**
 * Shared types for the workflow playground.
 *
 * A scenario is one small automation: a trigger (an inbound text), an AI step that turns
 * it into structured data, a deterministic rule step and the payload an action would send.
 * The AI never decides the rule outcome: code does, so the result is auditable.
 */

export type Lang = "es" | "en";
export type Bi = Record<Lang, string>;

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
export type JsonObject = { [k: string]: JsonValue };

/** The subset of JSON Schema the playground uses (also valid for OpenAI strict mode). */
export type Schema =
  | { type: "string"; enum?: readonly string[] }
  | { type: readonly ["string", "null"] }
  | { type: readonly ["number", "null"] }
  | { type: "number" }
  | { type: "array"; items: Schema; maxItems?: number }
  | {
      type: "object";
      properties: Record<string, Schema>;
      required: readonly string[];
      additionalProperties: false;
    };

export type ObjectSchema = Extract<Schema, { type: "object" }>;

export type NodeKind = "trigger" | "ai" | "rule" | "action";

export type FieldView = {
  key: string;
  label: Bi;
  /** How the human view renders the value. */
  as?: "text" | "badge" | "list" | "block" | "money";
};

export type Decision = {
  /** Short machine label, e.g. "route:sales". */
  outcome: string;
  /** One line a person can read, in the visitor's language. */
  reason: string;
  checks: { label: string; ok: boolean }[];
};

export type Scenario<T extends JsonObject = JsonObject> = {
  id: string;
  label: Bi;
  blurb: Bi;
  sample: Bi;
  nodes: { kind: NodeKind; title: Bi; tool: string }[];
  schema: ObjectSchema;
  /** Fields that must literally appear in the input text, so the model cannot invent them. */
  grounded: { strings: string[]; numbers: string[] };
  prompt: Bi;
  fields: FieldView[];
  fallback: (input: string, lang: Lang) => T;
  decide: (data: T, lang: Lang) => Decision;
  payload: (data: T, decision: Decision) => JsonObject;
};

export type RunResult = {
  scenario: string;
  mode: "ai" | "rules";
  ms: number;
  trigger: JsonObject;
  extracted: JsonObject;
  decision: Decision;
  payload: JsonObject;
};
