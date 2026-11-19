import { test } from "node:test";
import assert from "node:assert/strict";
import { DEMO_COMPANY, DEMO_PROFILE, RADAR_DEMO, cleanWhy, domainKey, profileSchema, questions, radarSchema, sameCompany, score } from "./radar.ts";
import { conformObject } from "./playground/validate.ts";

test("company matching ignores legal suffixes, accents and case", () => {
  assert.ok(sameCompany("Grúas Andes SpA", "gruas andes"));
  assert.ok(sameCompany("FRONTIERA", "Frontiera Chile"));
  assert.ok(sameCompany("Falabella", "Falabella.com"));
  assert.ok(!sameCompany("Andes", "Cuentas Claras"));
  assert.ok(!sameCompany("SA", "Ltda"));
});

test("domain matching", () => {
  assert.equal(domainKey("https://www.falabella.com/falabella-cl"), "falabella");
  assert.equal(domainKey("sodimac.cl"), "sodimac");
  assert.equal(domainKey("tienda.ripley.com.co"), "ripley");
  assert.equal(domainKey(""), "");
  const r = score("Grupo F", "x", "y", [{ question: "q", companies: [{ name: "Tienda F", web: "falabella.com", why: "a" }] }], "ai", { web: "www.falabella.com" });
  assert.equal(r.score, 1);
});

test("reasons lose markdown links and urls", () => {
  assert.equal(cleanWhy("Mejor para B2B. ([mkt.vtex.com](https://mkt.vtex.com/x?utm_source=openai))"), "Mejor para B2B");
  assert.equal(cleanWhy("**Grande** https://a.cl/b y barato"), "Grande y barato");
});

test("score counts hits, position, rival and ranking, and always shows the company", () => {
  const r = score(DEMO_COMPANY, "x", "y", RADAR_DEMO, "demo", { profile: DEMO_PROFILE });
  assert.equal(r.total, 3);
  assert.equal(r.score, 1);
  assert.equal(r.answers[2].hit, 4);
  assert.equal(r.answers[0].hit, null);
  assert.equal(r.rival, "Elevadores Sur");
  assert.ok(r.ranking.some((x) => x.you && x.count === 1));
  assert.match(r.fixes[0], /no encuentra/);
  const none = score("Nadie", "x", "y", RADAR_DEMO, "demo");
  assert.equal(none.score, 0);
  assert.ok(none.ranking.some((x) => x.you && x.count === 0));
  assert.match(none.fixes[0], /ninguna respuesta/);
});

test("questions and schemas", () => {
  assert.equal(questions("grúas", "Antofagasta").length, 3);
  assert.ok(conformObject(radarSchema, { answers: [{ question: "q", companies: [{ name: "A", web: "", why: "b" }] }] }));
  assert.ok(conformObject(profileSchema, { known: "si", description: "Tienda" }));
});

test("next step depends on the diagnosis", async () => {
  const { nextStep } = await import("./radar.ts");
  const base = { total: 3, rival: "X", company: "F" };
  assert.equal(nextStep({ ...base, score: 3, profile: { known: true, description: "d" } }).tier, "visible");
  assert.equal(nextStep({ ...base, score: 3, profile: { known: false, description: "" } }).tier, "partial");
  assert.equal(nextStep({ ...base, score: 1, profile: null }).tier, "partial");
  assert.equal(nextStep({ ...base, score: 0, profile: null }).tier, "invisible");
});
