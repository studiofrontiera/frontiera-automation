/**
 * Client for the public Mercado Publico API (ChileCompra).
 * Needs a free ticket (env MERCADOPUBLICO_TICKET), requested at the API portal with ClaveUnica.
 * Field names follow the public API docs; confirm against a live response once a ticket exists.
 */
export const BASE = "https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json";

const ESTADOS = { 5: "Publicada", 6: "Cerrada", 7: "Desierta", 8: "Adjudicada", 18: "Revocada", 19: "Suspendida" };

const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function createClient({ ticket = process.env.MERCADOPUBLICO_TICKET, fetchImpl = globalThis.fetch } = {}) {
  async function get(params) {
    if (!ticket) throw new Error("Falta MERCADOPUBLICO_TICKET: pide el ticket gratuito en la API de Mercado Público.");
    const url = new URL(BASE);
    for (const [k, v] of Object.entries({ ...params, ticket })) url.searchParams.set(k, v);
    const res = await fetchImpl(url);
    if (!res.ok) throw new Error(`Mercado Público respondió ${res.status}`);
    return res.json();
  }

  /** Active tenders whose name contains any of the words. The API has no text search, so we filter here. */
  async function buscar({ palabras, limite = 10 }) {
    const data = await get({ estado: "activas" });
    const terms = norm(palabras).split(/\s+/).filter(Boolean);
    const hits = (data.Listado ?? []).filter((l) => terms.some((t) => norm(l.Nombre).includes(t)));
    hits.sort((a, b) => String(a.FechaCierre).localeCompare(String(b.FechaCierre)));
    return {
      total_activas: data.Cantidad ?? (data.Listado ?? []).length,
      encontradas: hits.length,
      licitaciones: hits.slice(0, limite).map((l) => ({
        codigo: l.CodigoExterno, nombre: l.Nombre, cierre: l.FechaCierre,
        estado: ESTADOS[l.CodigoEstado] ?? String(l.CodigoEstado),
        url: `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${l.CodigoExterno}`,
      })),
    };
  }

  async function detalle({ codigo }) {
    const data = await get({ codigo });
    const l = (data.Listado ?? [])[0];
    if (!l) throw new Error(`No encontré la licitación ${codigo}`);
    return {
      codigo: l.CodigoExterno, nombre: l.Nombre, descripcion: l.Descripcion,
      organismo: l.Comprador?.NombreOrganismo, region: l.Comprador?.RegionUnidad,
      tipo: l.Tipo, monto_estimado: l.MontoEstimado ?? null, moneda: l.Moneda,
      publicacion: l.Fechas?.FechaPublicacion, cierre: l.Fechas?.FechaCierre,
      consultas_hasta: l.Fechas?.FechaFinal, adjudicacion_estimada: l.Fechas?.FechaEstimadaAdjudicacion,
      items: (l.Items?.Listado ?? []).map((i) => ({ producto: i.NombreProducto, descripcion: i.Descripcion, cantidad: i.Cantidad, unidad: i.UnidadMedida })),
    };
  }

  return { buscar, detalle };
}
