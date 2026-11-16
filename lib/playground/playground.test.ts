import { test } from "node:test";
import assert from "node:assert/strict";
import { SCENARIOS, complete, getScenario } from "./index.ts";
import { conformObject, ground } from "./validate.ts";
import { parseAmount } from "./scenarios/invoice.ts";

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
  assert.equal(s.decide(d, "es").outcome, "route:notify-now");
});

test("invoice: amounts parsed, totals checked, approval rule applied", () => {
  const s = getScenario("invoice")!;
  for (const lang of ["es", "en"] as const) {
    const d = s.fallback(s.sample[lang], lang);
    const k = lang === "es" ? 1000 : 1; // CLP sample is in pesos, EN sample in dollars
    assert.equal(d.net, 1000 * k);
    assert.equal(d.tax, 190 * k);
    assert.equal(d.total, 1190 * k);
    assert.equal(d.taxId, "76.123.456-7");
    assert.equal(d.invoiceNumber, "48213");
    assert.equal((d.items as unknown[]).length, 2);
    const decision = s.decide(d, lang);
    assert.equal(decision.outcome, "review:approval");
    assert.ok(decision.checks.every((c, i) => (i === 3 ? !c.ok : c.ok)));
  }
});

test("invoice: totals that do not add up go to review", () => {
  const s = getScenario("invoice")!;
  const d = { ...s.fallback(s.sample.es, "es"), total: 999 };
  assert.equal(s.decide(d, "es").outcome, "review:data");
});

test("support: routed to shipping and escalated", () => {
  const s = getScenario("support")!;
  const d = s.fallback(s.sample.es, "es");
  assert.equal(d.category, "shipping");
  assert.equal(d.priority, "high");
  assert.equal(d.orderId, "#A-20931");
  assert.equal(s.decide(d, "es").outcome, "route:shipping:escalate");
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
