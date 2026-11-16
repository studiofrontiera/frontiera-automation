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

/** A rule parameter the visitor can tune with a slider; the decision is recomputed in the browser. */
export type Setting = {
  key: string;
  label: Bi;
  min: number;
  max: number;
  step: number;
  default: number;
  unit: string;
};

export type Settings = Record<string, number>;

export type Scenario<T extends JsonObject = JsonObject> = {
  id: string;
  label: Bi;
  blurb: Bi;
  sample: Bi;
  /** A hard case (bad data, missing fields) that shows how the rules catch problems. */
  edge: Bi;
  edgeNote: Bi;
  /** Rough minutes a person spends on one item by hand, and a typical monthly volume (both estimates). */
  manualMinutes: number;
  monthlyVolume: number;
  volumeUnit: Bi;
  settings: Setting[];
  /** Accepts a PDF or image instead of text (the AI step reads the document first). */
  acceptsFiles?: boolean;
  nodes: { kind: NodeKind; title: Bi; tool: string }[];
  schema: ObjectSchema;
  /** Fields that must literally appear in the input text, so the model cannot invent them. */
  grounded: { strings: string[]; numbers: string[] };
  prompt: Bi;
  fields: FieldView[];
  fallback: (input: string, lang: Lang) => T;
  decide: (data: T, lang: Lang, settings: Settings) => Decision;
  payload: (data: T, decision: Decision, settings: Settings) => JsonObject;
  /** JavaScript for the rule node of the exported n8n workflow; `data` holds the extracted fields. */
  n8nRule: (settings: Settings) => string;
  /** The same rules as Make router filters. `v(key)` gives the mapping of a parsed field. */
  makeRoutes: (settings: Settings, v: (key: string) => string) => MakeRoute[];
};

/** A Make filter condition. Outer array of `when` = OR, inner array = AND (Make's own format). */
export type MakeCond = { a: string; o: string; b?: string };
export type MakeRoute = { outcome: string; label: string; when: MakeCond[][] };

export type RunResult = {
  scenario: string;
  mode: "ai" | "rules";
  /** Text the decision was grounded on: the input, or what the AI read from an uploaded document. */
  source: string;
  ms: number;
  trigger: JsonObject;
  extracted: JsonObject;
  decision: Decision;
  payload: JsonObject;
};
