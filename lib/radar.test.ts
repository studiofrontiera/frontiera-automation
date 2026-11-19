import { test } from "node:test";
import assert from "node:assert/strict";
import { RADAR_DEMO, questions, radarSchema, sameCompany, score } from "./radar.ts";
import { conformObject } from "./playground/validate.ts";

test("company matching ignores legal suffixes, accents and case", () => {
  assert.ok(sameCompany("Grúas Andes SpA", "gruas andes"));
  assert.ok(sameCompany("FRONTIERA", "Frontiera Chile"));
  assert.ok(!sameCompany("Andes", "Cuentas Claras"));
  assert.ok(!sameCompany("SA", "Ltda"));
});

test("score counts hits, position and ranking, and always shows the company", () => {
  const r = score("Su Empresa (ejemplo)", "x", "y", RADAR_DEMO, "demo");
  assert.equal(r.total, 5);
  assert.equal(r.score, 3);
  assert.equal(r.answers[0].hit, 3);
  assert.equal(r.answers[1].hit, null);
  assert.ok(r.ranking.some((x) => x.you && x.count === 3));
  const none = score("Nadie", "x", "y", RADAR_DEMO, "demo");
  assert.equal(none.score, 0);
  assert.ok(none.ranking.some((x) => x.you && x.count === 0));
  assert.match(none.fixes[0], /no lo nombra/);
});

test("questions and schema", () => {
  assert.equal(questions("grúas", "Antofagasta").length, 5);
  const ok = conformObject(radarSchema, { answers: [{ question: "q", companies: [{ name: "A", why: "b" }] }] });
  assert.ok(ok);
});
