"use client";

import { useState } from "react";
import { DEMO_COMPANY, DEMO_RUBRO, RADAR_DEMO, score, type RadarResult } from "@/lib/radar";

const EXAMPLE = score(DEMO_COMPANY, DEMO_RUBRO, "Santiago", RADAR_DEMO, "demo");

const ERRORS: Record<string, string> = {
  length: "Escriba su empresa y qué vende.",
  rate_limited: "Demasiadas consultas seguidas. Espere un minuto.",
  daily_limit: "Llegó al límite de hoy. Pida el diagnóstico completo.",
  ai_unavailable: "La IA no respondió. Intente de nuevo.",
};

/** One window, two answers to the same question: the AI today, and the AI with the company's connector. */
export function AiRadar() {
  const [company, setCompany] = useState("");
  const [rubro, setRubro] = useState("");
  const [ciudad, setCiudad] = useState("Santiago");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [r, setR] = useState<RadarResult>(EXAMPLE);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/radar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company, rubro, ciudad }) });
      const data = await res.json();
      if (!res.ok) setErr(ERRORS[data.error] ?? ERRORS.ai_unavailable);
      else setR(data);
    } catch {
      setErr(ERRORS.ai_unavailable);
    } finally {
      setBusy(false);
    }
  }

  const q = r.answers[0];
  const others = (q?.companies ?? []).filter((c) => !c.name || c.name !== r.company).slice(0, 3);

  return (
    <div className="radar">
      <form className="radar-form" onSubmit={run}>
        <label><span>Su empresa</span><input id="radar-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder={DEMO_COMPANY} required maxLength={80} /></label>
        <label><span>Qué vende</span><input id="radar-rubro" value={rubro} onChange={(e) => setRubro(e.target.value)} placeholder={DEMO_RUBRO} required maxLength={80} /></label>
        <label><span>Ciudad</span><input id="radar-ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value)} maxLength={80} /></label>
        <button className="btn" type="submit" disabled={busy}>{busy ? "Preguntando…" : "Probar"}</button>
      </form>
      {err && <p className="radar-err" role="alert">{err}</p>}

      <div className={`vs${busy ? " is-busy" : ""}`} aria-live="polite">
        <section className="vs-pane">
          <header className="vs-head mono"><span>Hoy</span><b className="bad">{r.score}/{r.total} respuestas lo nombran</b></header>
          <p className="vs-q">{q?.question}</p>
          <div className="vs-a">
            {others.length ? (
              <ol>{others.map((c) => <li key={c.name}><b>{c.name}</b> <span className="dim">· {c.why}</span></li>)}</ol>
            ) : <p className="dim">La IA no nombró empresas.</p>}
          </div>
          <p className="vs-verdict bad mono">→ El cliente se va con {others[0]?.name ?? "otro"}</p>
        </section>

        <section className="vs-pane good">
          <header className="vs-head mono"><span>Con su conector</span><b className="ok">venta en el chat</b></header>
          <p className="vs-q">{q?.question}</p>
          <p className="vs-call mono">{slug(r.company)} · consultar_disponibilidad()</p>
          <div className="vs-a">
            <p><b>{r.company}</b> ofrece {r.rubro} en {r.ciudad} y tiene disponibilidad esta semana. Puedo pedirle la cotización ahora.</p>
            <div className="vs-btns"><span className="vs-buy">Cotizar con {r.company}</span><span className="vs-alt">Ver condiciones</span></div>
          </div>
          <p className="vs-verdict ok mono">→ El cliente compra con usted</p>
        </section>
      </div>
      <p className="fine">{r.source === "demo" ? "Ejemplo con empresas ficticias. " : "Izquierda: respuesta real de un modelo de OpenAI con búsqueda web, sin saber qué empresa medimos. "}Derecha: simulación de lo que hace un conector.</p>
    </div>
  );
}

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "su-empresa";
