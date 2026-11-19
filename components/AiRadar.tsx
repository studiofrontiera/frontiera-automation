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

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "su-empresa";

/** One window, two answers to the same question: the AI today, and the AI with the company's connector. */
export function AiRadar() {
  const [company, setCompany] = useState("");
  const [rubro, setRubro] = useState("");
  const [ciudad, setCiudad] = useState("Santiago");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [r, setR] = useState<RadarResult>(EXAMPLE);
  const [qi, setQi] = useState(0);
  const [sent, setSent] = useState(false);
  const [run, setRun] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/radar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company, rubro, ciudad }) });
      const data = await res.json();
      if (!res.ok) setErr(ERRORS[data.error] ?? ERRORS.ai_unavailable);
      else { setR(data); setQi(0); setSent(false); setRun((n) => n + 1); }
    } catch {
      setErr(ERRORS.ai_unavailable);
    } finally {
      setBusy(false);
    }
  }

  const pick = (i: number) => { setQi(i); setSent(false); setRun((n) => n + 1); };
  const q = r.answers[qi];
  const list = (q?.companies ?? []).slice(0, 4);
  const winner = list.find((c) => !c.name.toLowerCase().includes(r.company.toLowerCase()))?.name ?? "otra empresa";
  const max = Math.max(...r.ranking.map((x) => x.count), 1);

  return (
    <div className="radar">
      <form className="radar-form" onSubmit={submit}>
        <label><span>Su empresa</span><input id="radar-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder={DEMO_COMPANY} required maxLength={80} /></label>
        <label><span>Qué vende</span><input id="radar-rubro" value={rubro} onChange={(e) => setRubro(e.target.value)} placeholder={DEMO_RUBRO} required maxLength={80} /></label>
        <label><span>Ciudad</span><input id="radar-ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value)} maxLength={80} /></label>
        <button className="btn" type="submit" disabled={busy}>{busy ? "Preguntando…" : "Probar"}</button>
      </form>
      {err && <p className="radar-err" role="alert">{err}</p>}

      <div className="qtabs" role="tablist" aria-label="Preguntas de clientes">
        {r.answers.map((a, i) => (
          <button key={i} role="tab" type="button" aria-selected={i === qi} className={`qtab mono${i === qi ? " on" : ""}${a.hit ? " hit" : ""}`} onClick={() => pick(i)} title={a.question}>
            <span>P{i + 1}</span><i aria-hidden="true">{a.hit ? "●" : "○"}</i>
          </button>
        ))}
        <span className="qtabs-note mono">{r.score}/{r.total} respuestas lo nombran</span>
      </div>

      <div className={`vs${busy ? " is-busy" : ""}`} aria-live="polite" key={run}>
        <section className="vs-pane">
          <header className="vs-head mono"><span>Hoy</span><b className="bad">{q?.hit ? `usted sale #${q.hit}` : "usted no aparece"}</b></header>
          <p className="vs-q">{q?.question}</p>
          <div className="vs-a">
            {list.length ? (
              <ol>{list.map((c, i) => (
                <li key={c.name} className="pop" style={{ animationDelay: `${0.15 + i * 0.18}s` }}>
                  <b>{c.name}</b> <span className="dim">· {c.why}</span>
                </li>
              ))}</ol>
            ) : <p className="dim">La IA no nombró empresas.</p>}
          </div>
          <p className="vs-verdict bad mono">→ El cliente se va con {winner}</p>
        </section>

        <section className="vs-pane good">
          <header className="vs-head mono"><span>Con su conector</span><b className="ok">venta en el chat</b></header>
          <p className="vs-q">{q?.question}</p>
          <ol className="vs-steps mono">
            <li className="pop" style={{ animationDelay: ".2s" }}><i>✓</i>{slug(r.company)} · consultar_catalogo()</li>
            <li className="pop" style={{ animationDelay: ".55s" }}><i>✓</i>{slug(r.company)} · disponibilidad(&quot;{r.ciudad}&quot;)</li>
            <li className="pop" style={{ animationDelay: ".9s" }}><i>✓</i>{slug(r.company)} · preparar_cotizacion()</li>
          </ol>
          <div className="vs-a pop" style={{ animationDelay: "1.25s" }}>
            {sent ? (
              <p><b>Listo.</b> {r.company} recibió su solicitud de cotización y le responde hoy.</p>
            ) : (
              <>
                <p><b>{r.company}</b> ofrece {r.rubro} en {r.ciudad} y tiene disponibilidad esta semana. ¿Le pido la cotización?</p>
                <div className="vs-btns">
                  <button type="button" className="vs-buy" onClick={() => setSent(true)}>Cotizar con {r.company}</button>
                  <span className="vs-alt">Ver condiciones</span>
                </div>
              </>
            )}
          </div>
          <p className="vs-verdict ok mono">→ {sent ? "Venta iniciada sin salir del chat" : "El cliente compra con usted"}</p>
        </section>
      </div>

      <div className="sov">
        <p className="label mono">{"// "}A quién recomienda la IA en las {r.total} preguntas</p>
        {r.ranking.map((x, i) => (
          <div className={`rank-row${x.you ? " you" : ""}`} key={x.name}>
            <span className="rank-name">{x.name}</span>
            <span className="rank-bar"><i style={{ width: `${(x.count / max) * 100}%`, animationDelay: `${i * 0.08}s` }} /></span>
            <span className="mono">{x.count}/{r.total}</span>
          </div>
        ))}
      </div>
      <p className="fine">{r.source === "demo" ? "Ejemplo con empresas ficticias. " : "Izquierda y ranking: respuestas reales de un modelo de OpenAI con búsqueda web, sin saber qué empresa medimos. "}Derecha: demostración de lo que hace un conector.</p>
    </div>
  );
}
