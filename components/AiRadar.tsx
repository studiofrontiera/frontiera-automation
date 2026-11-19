"use client";

import { useState } from "react";
import { FORM_ACTION } from "@/lib/copy";
import { DEMO_COMPANY, DEMO_PROFILE, DEMO_RUBRO, RADAR_DEMO, nextStep, score, type RadarResult } from "@/lib/radar";

const EXAMPLE = score(DEMO_COMPANY, DEMO_RUBRO, "Santiago", RADAR_DEMO, "demo", { profile: DEMO_PROFILE });

const ERRORS: Record<string, string> = {
  length: "Escriba su empresa y qué vende.",
  rate_limited: "Demasiadas consultas seguidas. Espere un minuto.",
  daily_limit: "Llegó al límite de diagnósticos de hoy. Déjenos su correo abajo y se lo enviamos.",
  ai_unavailable: "La IA no respondió. Intente de nuevo.",
};

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "su-empresa";

/** Free AI diagnosis: the same buyer question answered by the AI today and by the AI with the company's connector. */
export function AiRadar() {
  const [company, setCompany] = useState("");
  const [web, setWeb] = useState("");
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
      const res = await fetch("/api/radar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company, web, rubro, ciudad }) });
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
  const demo = r.source === "demo";
  const q = r.answers[qi];
  const list = q?.companies ?? [];
  const winner = q?.hit === 1 ? null : list[0]?.name ?? null;
  const max = Math.max(...r.ranking.map((x) => x.count), 1);
  const known = r.profile?.known;
  const step = nextStep(r);

  return (
    <div className="radar">
      <form className="radar-form" onSubmit={submit}>
        <label><span>Su empresa</span><input value={company} onChange={(e) => setCompany(e.target.value)} placeholder={DEMO_COMPANY} required maxLength={80} autoComplete="organization" /></label>
        <label><span>Sitio web <em>(opcional)</em></span><input value={web} onChange={(e) => setWeb(e.target.value)} placeholder="empresa.cl" maxLength={120} inputMode="url" autoComplete="url" /></label>
        <label><span>Qué vende</span><input value={rubro} onChange={(e) => setRubro(e.target.value)} placeholder={DEMO_RUBRO} required maxLength={80} /></label>
        <label><span>Ciudad</span><input value={ciudad} onChange={(e) => setCiudad(e.target.value)} maxLength={80} /></label>
        <button className="btn" type="submit" disabled={busy}>{busy ? "Analizando…" : "Diagnóstico gratis"}</button>
      </form>
      <p className="radar-note mono">Gratis · sin registro · resultado en menos de un minuto</p>
      {err && <p className="radar-err" role="alert">{err}</p>}

      {busy && (
        <ol className="radar-wait mono" aria-live="polite">
          <li className="pop">Escribiendo 3 preguntas como un cliente real…</li>
          <li className="pop" style={{ animationDelay: "2s" }}>Buscando en la web como lo hace ChatGPT…</li>
          <li className="pop" style={{ animationDelay: "5s" }}>Revisando qué sabe la IA de {company || "su empresa"}…</li>
        </ol>
      )}

      <div className={`radar-body${busy ? " is-busy" : ""}`}>
        {demo && <p className="radar-demo mono">Ejemplo con empresas ficticias. Escriba la suya arriba.</p>}

        <div className="qtabs" role="tablist" aria-label="Preguntas de clientes">
          {r.answers.map((a, i) => (
            <button key={i} role="tab" type="button" aria-selected={i === qi} className={`qtab mono${i === qi ? " on" : ""}${a.hit ? " hit" : ""}`} onClick={() => pick(i)} title={a.question}>
              <span>Pregunta {i + 1}</span><i aria-hidden="true">{a.hit ? "●" : "○"}</i>
            </button>
          ))}
        </div>

        <div className="vs" aria-live="polite" key={run}>
          <section className="vs-pane">
            <header className="vs-head mono"><span><i className="live-dot" aria-hidden="true" />{demo ? "Hoy · ejemplo" : "ChatGPT · respuesta real"}</span><b className="bad">{q?.hit ? `usted sale #${q.hit}` : "usted no aparece"}</b></header>
            <p className="vs-q">{q?.question}</p>
            <div className="vs-a">
              {list.length ? (
                <ol>{list.map((c, i) => (
                  <li key={c.name + i} className={`pop${q?.hit === i + 1 ? " you" : ""}`} style={{ animationDelay: `${0.15 + i * 0.18}s` }}>
                    <b>{c.name}</b>{c.why && <span className="dim"> · {c.why}</span>}
                  </li>
                ))}</ol>
              ) : <p className="dim">La IA no nombró empresas.</p>}
            </div>
            <p className={`vs-verdict mono ${winner ? "bad" : "ok"}`}>→ {winner ? `El cliente se va con ${winner}` : "Lo recomienda primero"}</p>
          </section>

          <section className="vs-pane good">
            <header className="vs-head mono"><span>Con su conector · simulación</span><b className="ok">venta en el chat</b></header>
            <p className="vs-q">{q?.question}</p>
            <ol className="vs-steps mono">
              <li className="pop" style={{ animationDelay: ".2s" }}><i>✓</i>{slug(r.company)} · consultar_catalogo()</li>
              <li className="pop" style={{ animationDelay: ".55s" }}><i>✓</i>{slug(r.company)} · disponibilidad(&quot;{r.ciudad}&quot;)</li>
              <li className="pop" style={{ animationDelay: ".9s" }}><i>✓</i>{slug(r.company)} · preparar_cotizacion()</li>
            </ol>
            <div className="vs-a pop" style={{ animationDelay: "1.25s" }}>
              {sent ? (
                <p><b>Listo.</b> {r.company} recibió su solicitud y le responde hoy.</p>
              ) : (
                <>
                  <p><b>{r.company}</b> tiene {r.rubro} en {r.ciudad}, con precio y stock al día. ¿Le pido la cotización?</p>
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

        <section className="diag" aria-label="Su diagnóstico">
          <p className="label mono">{"// "}Diagnóstico{demo ? " de ejemplo" : ""} · {r.company}</p>
          <div className="diag-tiles">
            <div className={`diag-tile${known ? "" : " warn"}`}>
              <span className="mono">¿La IA lo conoce?</span>
              <b>{r.profile ? (known ? "Sí" : "No") : "Sin dato"}</b>
              <p>{known ? `“${r.profile!.description}”` : "No encuentra información fiable sobre su empresa."}</p>
            </div>
            <div className={`diag-tile${r.score === r.total ? "" : " warn"}`}>
              <span className="mono">¿Lo recomienda?</span>
              <b>{r.score}<small>/{r.total}</small></b>
              <p>preguntas de clientes donde lo nombra</p>
            </div>
            <div className="diag-tile warn">
              <span className="mono">Se lleva sus clientes</span>
              <b className="diag-rival">{r.rival ?? "Nadie"}</b>
              <p>la empresa que más recomienda la IA</p>
            </div>
          </div>

          <div className="sov">
            {r.ranking.map((x, i) => (
              <div className={`rank-row${x.you ? " you" : ""}`} key={x.name}>
                <span className="rank-name">{x.name}</span>
                <span className="rank-bar"><i style={{ width: `${(x.count / max) * 100}%`, animationDelay: `${i * 0.08}s` }} /></span>
                <span className="mono">{x.count}/{r.total}</span>
              </div>
            ))}
          </div>

          <ol className="diag-fixes">{r.fixes.map((f) => <li key={f}>{f}</li>)}</ol>

          <div className={`diag-next ${step.tier}`}>
            <span className="path-tag mono">Su siguiente paso · {step.product} · {step.price}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
            {!demo && (
              <form className="diag-lead" action={FORM_ACTION} method="post">
                <input type="hidden" name="_subject" value={`Diagnóstico IA · ${r.company} · ${r.score}/${r.total} · ${step.product}`} />
                <input type="hidden" name="_template" value="table" />
                <input type="hidden" name="_next" value="https://www.frontiera.cl/?enviado=1#contacto" />
                <input type="text" name="_honey" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                <input type="hidden" name="empresa" value={r.company} />
                <input type="hidden" name="sitio" value={r.web} />
                <input type="hidden" name="rubro" value={`${r.rubro} · ${r.ciudad}`} />
                <input type="hidden" name="resultado" value={`Recomienda ${r.score}/${r.total}; la IA lo conoce: ${known ? "sí" : "no"}; rival: ${r.rival ?? "-"}; producto: ${step.product}`} />
                <div className="diag-lead-row">
                  <input name="email" type="email" required placeholder="correo@empresa.cl" autoComplete="email" aria-label="Correo" />
                  <input name="telefono" placeholder="WhatsApp (opcional)" autoComplete="tel" aria-label="WhatsApp" />
                  <button className="btn" type="submit">{step.cta} <span aria-hidden="true">→</span></button>
                </div>
              </form>
            )}
          </div>
        </section>

        <p className="fine">{demo ? "Empresas ficticias. " : "Respuestas reales de un modelo de OpenAI con búsqueda web. Las preguntas se hacen sin decirle qué empresa medimos. "}Lado derecho: demostración de lo que hace un conector.</p>
      </div>
    </div>
  );
}
