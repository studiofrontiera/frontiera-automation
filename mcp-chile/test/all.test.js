import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validarRut, boletaHonorarios, calcularIva } from "../src/chile.js";
import { createClient } from "../src/mercadopublico.js";
import { buildServer } from "../src/server.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

const fx = (n) => JSON.parse(readFileSync(new URL(`./fixtures/${n}.json`, import.meta.url)));
const fakeFetch = async (url) => ({ ok: true, json: async () => (url.searchParams.get("codigo") ? fx("detalle") : fx("activas")) });

test("rut", () => {
  assert.equal(validarRut("11.111.111-1").valido, true);
  assert.equal(validarRut("76.086.428-5").valido, true);
  const bad = validarRut("12345678-0");
  assert.equal(bad.valido, false);
  assert.equal(bad.rut_correcto, "12.345.678-5");
});

test("boleta honorarios 2026", () => {
  const b = boletaHonorarios(1000000, "bruto", 2026);
  assert.deepEqual([b.retencion, b.liquido], [152500, 847500]);
  const l = boletaHonorarios(500000, "liquido", 2026);
  assert.equal(l.bruto, 589971);
  assert.ok(Math.abs(l.liquido - 500000) <= 1);
  assert.throws(() => boletaHonorarios(1, "bruto", 2019));
});

test("iva", () => {
  assert.deepEqual([calcularIva(100000, "neto").total], [119000]);
  const t = calcularIva(119000, "total");
  assert.deepEqual([t.neto, t.iva], [100000, 19000]);
});

test("mercado publico search filters, ignores accents/case, sorts by closing", async () => {
  const mp = createClient({ ticket: "x", fetchImpl: fakeFetch });
  const r = await mp.buscar({ palabras: "video audiovisual" });
  assert.equal(r.encontradas, 2);
  assert.deepEqual(r.licitaciones.map((l) => l.codigo), ["3333-33-L126", "1111-11-L126"]);
  const d = await mp.detalle({ codigo: "3333-33-L126" });
  assert.equal(d.organismo, "Organismo de prueba");
  assert.equal(d.items.length, 1);
});

test("missing ticket gives clear error", async () => {
  const mp = createClient({ ticket: "", fetchImpl: fakeFetch });
  await assert.rejects(mp.buscar({ palabras: "video" }), /MERCADOPUBLICO_TICKET/);
});

test("MCP server end to end over in-memory transport", async () => {
  const server = buildServer(createClient({ ticket: "x", fetchImpl: fakeFetch }));
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "t", version: "0" });
  await Promise.all([server.connect(a), client.connect(b)]);
  const tools = (await client.listTools()).tools.map((t) => t.name).sort();
  assert.deepEqual(tools, ["boleta_honorarios", "buscar_licitaciones", "calcular_iva", "detalle_licitacion", "validar_rut"]);
  const r = await client.callTool({ name: "buscar_licitaciones", arguments: { palabras: "automatizacion" } });
  assert.equal(r.structuredContent.licitaciones[0].codigo, "4444-44-LP26");
  const h = await client.callTool({ name: "boleta_honorarios", arguments: { monto: 500000, modo: "liquido", anio: 2026 } });
  console.log(h.structuredContent.resumen);
});
