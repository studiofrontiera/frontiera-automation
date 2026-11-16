import { test } from "node:test";
import assert from "node:assert/strict";
import { ruleBasedLead, sanitizeLead } from "./demo.ts";

const MSG = "Hola, soy Carla Rojas de la empresa Ferretería Sur. Necesito una cotización urgente para automatizar la facturación. Mi correo es carla@ferreteriasur.example y mi teléfono +56 9 1234 5678.";

test("rule-based extraction finds contact data, intent and urgency", () => {
  const lead = ruleBasedLead(MSG, "es");
  assert.equal(lead.name, "Carla Rojas");
  assert.equal(lead.email, "carla@ferreteriasur.example");
  assert.equal(lead.intent, "quote");
  assert.equal(lead.urgency, "high");
  assert.ok(lead.reply.startsWith("Hola Carla,"));
});

test("english message", () => {
  const lead = ruleBasedLead("Hi, my name is John Smith. Our CRM sync is not working, can you help this week?", "en");
  assert.equal(lead.name, "John Smith");
  assert.equal(lead.intent, "support");
  assert.equal(lead.urgency, "medium");
});

test("sanitizer drops invented contact data and bad enums", () => {
  const ok = sanitizeLead(
    { name: "Carla", company: null, email: "invented@x.com", phone: null, intent: "quote", urgency: "high", summary: "S", tasks: ["a"], reply: "R \u2014 ok" },
    MSG,
    "es"
  );
  assert.equal(ok?.email, null);
  assert.equal(ok?.reply.includes("\u2014"), false);
  assert.equal(sanitizeLead({ intent: "nope" }, MSG, "es"), null);
});
