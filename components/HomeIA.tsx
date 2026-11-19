import Link from "next/link";
import { FORM_ACTION, WHATSAPP } from "@/lib/copy";
import { AiRadar } from "./AiRadar";

const PLANS = [
  { k: "01", t: "Diagnóstico IA", p: "USD 290", n: "5 días", b: "Qué responden ChatGPT, Claude, Gemini y Perplexity sobre su rubro, y por qué eligen a otros." },
  { k: "02", t: "Presencia IA", p: "USD 900", n: "+ USD 150/mes", b: "Su información lista para que la IA la cite. Medición mensual." },
  { k: "03", t: "Conector propio", p: "desde USD 2.500", n: "+ mantención", b: "La IA consulta sus precios y agenda y vende por usted." },
];

export function HomeIA() {
  return (
    <>
      <header className="top">
        <div className="wrap top-in">
          <Link className="brand" href="/" aria-label="FRONTIERA">
            {/* eslint-disable-next-line @next/next/no-img-element -- brand asset */}
            <img src="/frontiera-wordmark.webp" alt="FRONTIERA" width={520} height={66} />
            <span className="brand-tag mono">IA · B2B</span>
          </Link>
          <nav className="nav">
            <a href="#radar">Probar</a>
            <a href="#oferta">Oferta</a>
          </nav>
          <div className="top-act"><a className="btn btn-sm" href="#contacto">Diagnóstico</a></div>
        </div>
      </header>

      <main>
        <section className="hero ia-hero" id="radar">
          <div className="grid-bg" aria-hidden="true" />
          <div className="wrap">
            <p className="kicker mono">Empresas B2B · Chile</p>
            <h1 className="ia-h1">Su <s>sitio web</s> <span className="accent">ya no vende.</span></h1>
            <p className="lead">Sus clientes le preguntan a ChatGPT. Pruebe qué les responde.</p>
            <AiRadar />
          </div>
        </section>

        <section className="sec sec-line" id="oferta">
          <div className="wrap">
            <p className="label mono">{"// "}Oferta</p>
            <h2>Pase del lado derecho.</h2>
            <div className="ia-plans">
              {PLANS.map((p) => (
                <article key={p.k} className="ia-plan">
                  <span className="mono accent">{p.k}</span>
                  <h3>{p.t}</h3>
                  <p>{p.b}</p>
                  <div className="mono"><b>{p.p}</b> <span className="dim">{p.n}</span></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sec sec-line" id="contacto">
          <div className="wrap contact">
            <div>
              <h2>Empiece por saber dónde está.</h2>
              <p className="sub">Respondemos en un día hábil.</p>
              <a className="link" href={WHATSAPP.es} target="_blank" rel="noopener noreferrer">WhatsApp →</a>
            </div>
            <form className="form" action={FORM_ACTION} method="post">
              <input type="hidden" name="_subject" value="Diagnóstico IA · frontiera.cl" />
              <input type="hidden" name="_template" value="table" />
              <input type="hidden" name="_next" value="https://www.frontiera.cl/?enviado=1#contacto" />
              <input type="text" name="_honey" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <div className="row">
                <label><span>Nombre</span><input name="name" required autoComplete="name" /></label>
                <label><span>Email</span><input name="email" type="email" required autoComplete="email" /></label>
              </div>
              <div className="row">
                <label><span>Empresa</span><input name="company" autoComplete="organization" /></label>
                <label><span>Rubro</span><input name="rubro" /></label>
              </div>
              <label><span>¿Qué quiere lograr?</span><textarea name="message" rows={4} required /></label>
              <button className="btn" type="submit">Pedir diagnóstico <span aria-hidden="true">→</span></button>
            </form>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot-in mono">
          <span>FRONTIERA SpA · Santiago de Chile</span>
          <Link href="/automatizacion">Demos de automatización</Link>
          <Link href="/privacidad">Privacidad</Link>
        </div>
      </footer>
    </>
  );
}
