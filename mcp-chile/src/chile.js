/** Deterministic Chilean SME calculations. No network. */

/** Retention on boletas de honorarios by year (Ley 21.133 schedule). */
export const RETENCION_HONORARIOS = { 2024: 0.1375, 2025: 0.145, 2026: 0.1525, 2027: 0.16, 2028: 0.17 };
export const IVA = 0.19;

const fmt = (n) => "$" + Math.round(n).toLocaleString("es-CL");

/** Check digit of a RUT body using modulo 11. */
export function digitoVerificador(cuerpo) {
  let sum = 0, mul = 2;
  for (const d of String(cuerpo).split("").reverse()) {
    sum += Number(d) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const r = 11 - (sum % 11);
  return r === 11 ? "0" : r === 10 ? "K" : String(r);
}

export function validarRut(input) {
  const clean = String(input).toUpperCase().replace(/[^0-9K]/g, "");
  if (clean.length < 2) return { valido: false, motivo: "RUT demasiado corto" };
  const cuerpo = clean.slice(0, -1), dv = clean.slice(-1);
  if (!/^\d+$/.test(cuerpo)) return { valido: false, motivo: "El cuerpo del RUT debe ser numérico" };
  const esperado = digitoVerificador(cuerpo);
  const formateado = Number(cuerpo).toLocaleString("es-CL") + "-" + esperado;
  return dv === esperado
    ? { valido: true, rut: formateado }
    : { valido: false, motivo: `Dígito verificador incorrecto: debería ser ${esperado}`, rut_correcto: formateado };
}

export function boletaHonorarios(monto, modo, anio = new Date().getFullYear()) {
  const tasa = RETENCION_HONORARIOS[anio];
  if (tasa === undefined) throw new Error(`Sin tasa para ${anio}. Disponibles: ${Object.keys(RETENCION_HONORARIOS).join(", ")}`);
  const bruto = modo === "liquido" ? Math.round(monto / (1 - tasa)) : Math.round(monto);
  const retencion = Math.round(bruto * tasa);
  const liquido = bruto - retencion;
  return { anio, tasa_pct: +(tasa * 100).toFixed(2), bruto, retencion, liquido,
    resumen: `Bruto ${fmt(bruto)} · retención ${(tasa * 100).toFixed(2).replace(".", ",")}% ${fmt(retencion)} · líquido ${fmt(liquido)}` };
}

export function calcularIva(monto, modo) {
  const neto = modo === "total" ? Math.round(monto / (1 + IVA)) : Math.round(monto);
  const iva = modo === "total" ? Math.round(monto) - neto : Math.round(neto * IVA);
  const total = neto + iva;
  return { neto, iva, total, resumen: `Neto ${fmt(neto)} · IVA 19% ${fmt(iva)} · total ${fmt(total)}` };
}
