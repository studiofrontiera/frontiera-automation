import type { JsonObject, JsonValue, ObjectSchema, Schema } from "./types.ts";

const MAX_STRING = 1200;
const LONG_DASH = /\u2014/g;

/**
 * Coerces untrusted model output into the schema, or returns null.
 * Strings are trimmed and bounded, enums are enforced, unknown keys are dropped.
 */
export function conform(schema: Schema, value: unknown): JsonValue | undefined {
  const t = schema.type;
  if (t === "string") {
    if (typeof value !== "string" || !value.trim()) return undefined;
    const s = value.trim().replace(LONG_DASH, ",").slice(0, MAX_STRING);
    if ("enum" in schema && schema.enum && !schema.enum.includes(s)) return undefined;
    return s;
  }
  if (t === "number") return typeof value === "number" && Number.isFinite(value) ? value : undefined;
  if (t === "array") {
    if (!Array.isArray(value)) return undefined;
    const items = value.map((v) => conform(schema.items, v)).filter((v): v is JsonValue => v !== undefined);
    return items.slice(0, schema.maxItems ?? 20);
  }
  if (t === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    const src = value as Record<string, unknown>;
    const out: JsonObject = {};
    for (const key of schema.required) {
      const v = conform(schema.properties[key], src[key]);
      if (v === undefined) {
        const nullable = Array.isArray(schema.properties[key].type);
        if (!nullable) return undefined;
        out[key] = null;
      } else out[key] = v;
    }
    return out;
  }
  /* nullable scalars: ["string","null"] or ["number","null"] */
  if (value === null || value === undefined) return null;
  if (t[0] === "string") return conform({ type: "string" }, value) ?? null;
  return conform({ type: "number" }, value) ?? null;
}

export function conformObject(schema: ObjectSchema, value: unknown): JsonObject | null {
  const v = conform(schema, value);
  return v && typeof v === "object" && !Array.isArray(v) ? v : null;
}

const digits = (s: string) => s.replace(/\D/g, "");

/**
 * Grounding: a string field survives only if it appears in the input (case-insensitive),
 * a number only if its integer digits appear in the input's digits. Anything else becomes
 * null, so an invented e-mail, RUT or amount never reaches the payload.
 */
export function ground(data: JsonObject, input: string, keys: { strings: string[]; numbers: string[] }): JsonObject {
  const text = input.toLowerCase();
  const allDigits = digits(input);
  const out: JsonObject = { ...data };
  for (const k of keys.strings) {
    const v = out[k];
    if (typeof v === "string" && !text.includes(v.toLowerCase())) out[k] = null;
  }
  for (const k of keys.numbers) {
    const v = out[k];
    if (typeof v === "number" && !allDigits.includes(digits(String(Math.trunc(v))))) out[k] = null;
  }
  return out;
}
