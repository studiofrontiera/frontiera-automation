import { test } from "node:test";
import assert from "node:assert/strict";
import { SCENARIOS, complete, defaults, getScenario, sanitizeSettings } from "./index.ts";
import { conformObject, ground } from "./validate.ts";
import { parseAmount, rutValid } from "./scenarios/invoice.ts";
import { toN8n } from "./n8n.ts";
import { toMake } from "./make.ts";
import type { JsonObject, MakeCond } from "./types.ts";
import { designFallback, designSchema, designToN8n } from "./design.ts";

test("every scenario runs end to end on its own samples, in both languages", () => {
  for (const s of SCENARIOS) {
    for (const lang of ["es", "en"] as const) {
      const extracted = s.fallback(s.sample[lang], lang);
      assert.ok(conformObject(s.schema, extracted), `${s.id}/${lang} fallback matches its schema`);
      const r = complete(s, s.sample[lang], extracted, "rules", 1, lang);
      assert.ok(r.decision.outcome.length > 0);
      assert.ok(Object.keys(r.payload).length > 0);
      assert.ok(!JSON.stringify(r).includes("\u2014"), "no long dashes");
    }
  }
});

test("lead: contact data, intent and urgency", () => {
  const s = getScenario("lead")!;
  const d = s.fallback(s.sample.es, "es");
  assert.equal(d.name, "Carla Rojas");
  assert.equal(d.email, "carla@ferreteriasur.example");
  assert.equal(d.intent, "quote");
  assert.equal(d.urgency, "high");
  assert.equal(s.decide(d, "es", defaults(s)).outcome, "route:notify-now");
});

test("invoice: amounts parsed, totals checked, approval rule applied", () => {
  const s = getScenario("invoice")!;
  for (const lang of ["es", "en"] as const) {
    const d = s.fallback(s.sample[lang], lang);
    const k = lang === "es" ? 1000 : 1; // CLP sample is in pesos, EN sample in dollars
    assert.equal(d.net, 1000 * k);
    assert.equal(d.tax, 190 * k);
    assert.equal(d.total, 1190 * k);
    assert.equal(d.taxId, "76.123.456-0");
    assert.equal(d.invoiceNumber, "48213");
    assert.equal((d.items as unknown[]).length, 2);
    const decision = s.decide(d, lang, defaults(s));
    assert.equal(decision.outcome, "review:approval");
    assert.ok(decision.checks.every((c, i, all) => (i === all.length - 1 ? !c.ok : c.ok)), JSON.stringify(decision.checks));
  }
});

test("invoice: totals that do not add up go to review", () => {
  const s = getScenario("invoice")!;
  const d = { ...s.fallback(s.sample.es, "es"), total: 999 };
  assert.equal(s.decide(d, "es", defaults(s)).outcome, "review:data");
});

test("support: routed to shipping and escalated", () => {
  const s = getScenario("support")!;
  const d = s.fallback(s.sample.es, "es");
  assert.equal(d.category, "shipping");
  assert.equal(d.priority, "high");
  assert.equal(d.orderId, "#A-20931");
  assert.equal(s.decide(d, "es", defaults(s)).outcome, "route:shipping:escalate");
});

test("parseAmount handles CLP and USD formats", () => {
  assert.equal(parseAmount("1.190.000"), 1190000);
  assert.equal(parseAmount("1,190.50"), 1190.5);
  assert.equal(parseAmount("$ 595.000"), 595000);
  assert.equal(parseAmount("12,5"), 12.5);
});

test("validator drops bad enums and grounding nulls invented data", () => {
  const s = getScenario("lead")!;
  assert.equal(conformObject(s.schema, { intent: "nope" }), null);
  const ok = conformObject(s.schema, {
    name: "Carla", company: null, email: "invented@x.example", phone: null,
    intent: "quote", urgency: "high", summary: "S \u2014 x", tasks: ["a"], reply: "R",
  })!;
  assert.equal(ok.summary, "S , x");
  const g = ground(ok, s.sample.es, s.grounded);
  assert.equal(g.email, null);
  const inv = getScenario("invoice")!;
  const grounded = ground({ total: 5555, net: 1000000 }, inv.sample.es, inv.grounded);
  assert.equal(grounded.total, null);
  assert.equal(grounded.net, 1000000);
});

test("support: customer name found after a capitalised 'Soy'", () => {
  const s = getScenario("support")!;
  assert.equal(s.fallback(s.sample.es, "es").customer, "Tomás Fuentes");
});

test("every edge case is caught by the rules, in both languages", () => {
  const expected: Record<string, string> = { lead: "hold:no-contact", invoice: "review:data", support: "route:" };
  for (const s of SCENARIOS) {
    for (const lang of ["es", "en"] as const) {
      const d = s.fallback(s.edge[lang], lang);
      assert.ok(conformObject(s.schema, d), `${s.id}/${lang} edge matches schema`);
      const r = complete(s, s.edge[lang], d, "rules", 1, lang);
      assert.ok(r.decision.outcome.startsWith(expected[s.id]), `${s.id}/${lang}: ${r.decision.outcome}`);
      assert.ok(r.decision.checks.some((c) => !c.ok), `${s.id}/${lang} shows a failed check`);
    }
  }
});

test("invoice edge: wrong RUT check digit and inflated total both fail", () => {
  assert.equal(rutValid("76.123.456-0"), true);
  assert.equal(rutValid("76.123.456-7"), false);
  assert.equal(rutValid("12.345.678-5"), true);
  assert.equal(rutValid("ABC-123"), null);
  const s = getScenario("invoice")!;
  const d = s.fallback(s.edge.es, "es");
  assert.equal(d.total, 1290000);
  const failed = s.decide(d, "es", defaults(s)).checks.filter((c) => !c.ok).map((c) => c.label);
  assert.ok(failed.some((l) => l.includes("RUT")));
  assert.ok(failed.some((l) => l.includes("total")));
});

test("settings: sliders change the decision and are clamped", () => {
  const s = getScenario("invoice")!;
  const d = s.fallback(s.sample.es, "es");
  assert.equal(s.decide(d, "es", { ...defaults(s), limitClp: 2_000_000 }).outcome, "auto:approved");
  assert.equal(sanitizeSettings(s, { limitClp: 99_999_999, hack: 1 }).limitClp, 5_000_000);
  assert.equal(sanitizeSettings(s, { limitClp: "x" }).limitClp, 1_000_000);
  const sup = getScenario("support")!;
  const t = sup.fallback(sup.sample.es, "es");
  assert.equal((complete(sup, "", t, "rules", 1, "es", { ...defaults(sup), slaHigh: 5 }).payload.ticket as { sla_hours: number }).sla_hours, 5);
});

test("n8n export: valid chain, settings baked in, rule code runs", () => {
  for (const s of SCENARIOS) {
    const wf = toN8n(s, defaults(s), "es");
    assert.equal(wf.nodes.length, 6);
    assert.equal(Object.keys(wf.connections).length, 5);
    assert.ok(!JSON.stringify(wf).includes("sk-"), "no API key");
    const rule = wf.nodes.find((n) => n.name === "Rule: decide")!.parameters.jsCode as string;
    const data = s.fallback(s.sample.es, "es");
    const out = new Function("$json", rule)({ data }) as { decision: { outcome: string } };
    assert.equal(out.decision.outcome, s.decide(data, "es", defaults(s)).outcome, s.id);
    for (const n of wf.nodes.filter((x) => x.type === "n8n-nodes-base.code")) {
      assert.doesNotThrow(() => new Function("$json", "$", n.parameters.jsCode as string), `${s.id} ${n.name} parses`);
    }
  }
  const inv = getScenario("invoice")!;
  assert.ok(String(toN8n(inv, { ...defaults(inv), limitClp: 700_000 }, "es").nodes[4].parameters.jsCode).includes("700000"));
});

test("design: fallback fits the schema and exports to n8n", () => {
  for (const lang of ["es", "en"] as const) {
    const d = designFallback("Recibimos facturas por correo y las pasamos a mano al sistema contable", lang);
    assert.ok(conformObject(designSchema, d));
    assert.ok(d.steps.some((x) => x.kind === "human"), "money flow gets a human approval");
    const wf = designToN8n(d, lang);
    assert.equal(wf.nodes.length, d.steps.length + 1);
    assert.ok(!JSON.stringify(d).includes("\u2014"));
  }
});

/** Evaluates Make mappings like {{4.total}}, {{abs(4.net + 4.tax - 4.total)}}, {{if(4.currency = "CLP"; 1; 2)}}. */
function makeEval(value: string, d: JsonObject): unknown {
  const expr = (e: string) => {
    const js = e.replace(/\b4\.(\w+)/g, 'd["$1"]').replace(/;/g, ",").replace(/\bif\(/g, "iff(").replace(/ = /g, " === ").replace(/\babs\(/g, "Math.abs(");
    return new Function("d", "iff", `return (${js});`)(d, (c: boolean, a: unknown, b: unknown) => (c ? a : b));
  };
  const whole = value.match(/^\{\{(.*)\}\}$/);
  if (whole) return expr(whole[1]);
  return value.replace(/\{\{(.*?)\}\}/g, (_, e) => String(expr(e)));
}
function makeMatch(when: MakeCond[][], d: JsonObject): boolean {
  return when.some((group) =>
    group.every(({ a, o, b }) => {
      const x = makeEval(a, d);
      const y = b === undefined ? undefined : makeEval(b, d);
      const present = x !== null && x !== undefined && x !== "";
      switch (o) {
        case "exist": return present;
        case "notexist": return !present;
        case "text:equal": return String(x) === String(y);
        case "text:notequal": return String(x) !== String(y);
        case "number:less": return Number(x) < Number(y);
        case "number:lessorequal": return Number(x) <= Number(y);
        case "number:greater": return Number(x) > Number(y);
        case "number:greaterorequal": return Number(x) >= Number(y);
        default: throw new Error(`unknown operator ${o}`);
      }
    })
  );
}

test("make export: valid blueprint, and its router filters give the same outcome as the playground", () => {
  for (const s of SCENARIOS) {
    const bp = toMake(s, defaults(s), "es");
    const ai = bp.flow.find((m) => m.module === "http:ActionSendData")!;
    const body = String((ai.mapper as JsonObject).data).replace("{{2.json}}", JSON.stringify("hola \"mundo\""));
    const req = JSON.parse(body);
    assert.equal(req.input[1].content[0].text, 'hola "mundo"');
    assert.equal(req.text.format.strict, true);
    assert.ok(!JSON.stringify(bp).includes("sk-"), "no key inside");
    const routes = s.makeRoutes(defaults(s), (k) => `4.${k}`);
    for (const lang of ["es", "en"] as const) {
      for (const text of [s.sample[lang], s.edge[lang]]) {
        const d = s.fallback(text, lang);
        const expected = s.decide(d, lang, defaults(s)).outcome;
        /* Make has no check-digit filter: a bad RUT alone is the one case where only n8n catches it. */
        const matched = routes.filter((r) => makeMatch(r.when, d)).map((r) => makeEval(r.outcome, d));
        assert.deepEqual(matched, [expected], `${s.id}/${lang}`);
      }
    }
  }
  const inv = getScenario("invoice")!;
  const big = { ...inv.fallback(inv.sample.es, "es"), total: 1_190_000 };
  const r = inv.makeRoutes({ ...defaults(inv), limitClp: 2_000_000 }, (k) => `4.${k}`);
  assert.deepEqual(r.filter((x) => makeMatch(x.when, big)).map((x) => x.outcome), ["auto:approved"], "slider value reaches the filter");
});

test("roi: computed only from the visitor's inputs", async () => {
  const { roi } = await import("../roi.ts");
  const r = roi({ volume: 300, minutes: 7, rate: 8000, review: 10, tools: 40000 });
  assert.equal(r.manualMonth, 35 * 8000);
  assert.equal(Math.round(r.hoursMonth * 10) / 10, 31.5);
  assert.equal(r.netMonth, 280000 - (3.5 * 8000 + 40000));
  assert.ok(roi({ volume: 10, minutes: 1, rate: 3000, review: 0, tools: 500000 }).netMonth < 0);
});
