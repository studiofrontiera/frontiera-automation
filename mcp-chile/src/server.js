#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { validarRut, boletaHonorarios, calcularIva } from "./chile.js";
import { createClient } from "./mercadopublico.js";

export function buildServer(mp = createClient()) {
  const server = new McpServer({ name: "frontiera-chile", version: "0.1.0" });
  const ok = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }], structuredContent: obj });
  const fail = (e) => ({ content: [{ type: "text", text: e.message }], isError: true });
  const ro = { readOnlyHint: true, openWorldHint: false };

  server.registerTool("buscar_licitaciones", {
    title: "Buscar licitaciones en Mercado Público",
    description: "Busca licitaciones activas del Estado de Chile cuyo nombre contiene alguna de las palabras. Devuelve código, nombre, fecha de cierre y enlace, ordenadas por cierre más próximo.",
    inputSchema: { palabras: z.string().min(2).describe("Palabras clave, por ejemplo 'video audiovisual'"), limite: z.number().int().min(1).max(50).default(10) },
    annotations: { readOnlyHint: true, openWorldHint: true },
  }, async (a) => { try { return ok(await mp.buscar(a)); } catch (e) { return fail(e); } });

  server.registerTool("detalle_licitacion", {
    title: "Detalle de una licitación",
    description: "Devuelve organismo, región, monto estimado, fechas clave (publicación, consultas, cierre, adjudicación) e ítems de una licitación por su código.",
    inputSchema: { codigo: z.string().min(5).describe("Código externo, por ejemplo 1234-56-LE26") },
    annotations: { readOnlyHint: true, openWorldHint: true },
  }, async (a) => { try { return ok(await mp.detalle(a)); } catch (e) { return fail(e); } });

  server.registerTool("validar_rut", {
    title: "Validar RUT chileno",
    description: "Verifica el dígito verificador de un RUT y lo devuelve formateado.",
    inputSchema: { rut: z.string().describe("RUT con o sin puntos y guion") }, annotations: ro,
  }, async ({ rut }) => ok(validarRut(rut)));

  server.registerTool("boleta_honorarios", {
    title: "Calcular boleta de honorarios",
    description: "Calcula bruto, retención y líquido de una boleta de honorarios con la tasa del año (13,75% 2024 hasta 17% 2028).",
    inputSchema: { monto: z.number().positive(), modo: z.enum(["bruto", "liquido"]).describe("Si el monto dado es bruto o líquido"), anio: z.number().int().optional() },
    annotations: ro,
  }, async ({ monto, modo, anio }) => { try { return ok(boletaHonorarios(monto, modo, anio)); } catch (e) { return fail(e); } });

  server.registerTool("calcular_iva", {
    title: "Calcular IVA",
    description: "Separa o agrega el IVA chileno del 19%.",
    inputSchema: { monto: z.number().positive(), modo: z.enum(["neto", "total"]).describe("Si el monto dado es neto o total con IVA") },
    annotations: ro,
  }, async ({ monto, modo }) => ok(calcularIva(monto, modo)));

  return server;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("server.js")) {
  await buildServer().connect(new StdioServerTransport());
}
