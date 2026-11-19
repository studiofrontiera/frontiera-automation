"use client";

import { useState } from "react";
import { RADAR_DEMO, score, type RadarResult } from "@/lib/radar";

const EXAMPLE = score("Su Empresa (ejemplo)", "servicios contables", "Santiago", RADAR_DEMO, "demo");

const ERRORS: Record<string, string> = {
  length: "Escriba el nombre de su empresa y su rubro.",
  rate_limited: "Demasiadas consultas seguidas. Espere un minuto.",
  daily_limit: "Llegó al límite de consultas de hoy. Pida el diagnóstico completo abajo.",
  ai_unavailable: "La IA no respondió esta vez. Intente de nuevo en un momento.",
};

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

  const pct = r.total ? r.score / r.total : 0;
  const max = Math.max(...r.ranking.map((x) => x.count), 1);
  const C = 2 * Math.PI * 52;

  return (
    <div className="radar">
      <form className="radar-form" onSubmit={run}>
        <label><span>Su empresa</span><input id="radar-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Nombre comercial" required maxLength={80} /></label>
        <label><span>Qué vende</span><input id="radar-rubro" value={rubro} onChange={(e) => setRubro(e.target.value)} placeholder="ej. arriendo de grúas horquilla" required maxLength={80} /></label>
        <label><span>Ciudad</span><input id="radar-ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value)} maxLength={80} /></label>
        <button className="btn" type="submit" disabled={busy}>{busy ? "Preguntando a la IA…" : "Preguntar a la IA"}</button>
      </form>
      {err && <p className="radar-err" role="alert">{err}</p>}

      <div className={`radar-out${busy ? " is-busy" : ""}`} aria-live="polite">
        {r.source === "demo" && <p className="radar-demo mono">Ejemplo con empresas ficticias. Escriba los datos de su empresa para ver su resultado real.</p>}
        <div className="radar-top">
          <figure className="radar-ring" aria-label={`Visibilidad: ${r.score} de ${r.total}`}>
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" className="ring-bg" />
              <circle cx="60" cy="60" r="52" className="ring-fg" strokeDasharray={`${C * pct} ${C}`} transform="rotate(-90 60 60)" />
            </svg>
            <figcaption><b className="mono">{r.score}/{r.total}</b><span>respuestas lo nombran</span></figcaption>
          </figure>
          <div className="radar-rank">
            <p className="label mono">{"// "}A quién recomienda la IA</p>
            {r.ranking.map((x) => (
              <div className={`rank-row${x.you ? " you" : ""}`} key={x.name}>
                <span className="rank-name">{x.name}</span>
                <span className="rank-bar"><i style={{ width: `${(x.count / max) * 100}%` }} /></span>
                <span className="mono">{x.count}</span>
              </div>
            ))}
          </div>
        </div>

        <ol className="radar-qs">
          {r.answers.map((a) => (
            <li key={a.question}>
              <span className={`q-mark mono${a.hit ? " ok" : ""}`}>{a.hit ? `#${a.hit}` : "×"}</span>
              <div>
                <p className="q-text">{a.question}</p>
                <p className="q-names dim">{a.companies.length ? a.companies.map((c) => c.name).join(" · ") : "La IA no nombró empresas"}</p>
              </div>
            </li>
          ))}
        </ol>

        <ul className="radar-fixes">
          {r.fixes.map((f) => <li key={f}>{f}</li>)}
        </ul>
        <p className="fine">Respuestas generadas por un modelo de OpenAI con búsqueda web, sin decirle qué empresa medimos. ChatGPT, Claude o Gemini pueden responder distinto, por eso el diagnóstico completo los revisa todos.</p>
      </div>
    </div>
  );
}
