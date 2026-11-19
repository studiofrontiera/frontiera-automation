import Link from "next/link";
import { FORM_ACTION, WHATSAPP } from "@/lib/copy";
import { AiRadar } from "./AiRadar";
import { Waffle } from "./Waffle";

const PEW = "https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/";

const PLANS = [
  { k: "01", tag: "Empiece aquí", t: "Diagnóstico IA", p: "USD 290", n: "una vez · 5 días", items: ["20 preguntas reales de sus clientes", "ChatGPT, Claude, Gemini y Perplexity", "Quién gana cada respuesta y por qué"] },
  { k: "02", tag: "Aparecer", t: "Presencia IA", p: "USD 900", n: "+ USD 150 al mes", items: ["Su información lista para que la IA la cite", "Fichas en las fuentes que la IA lee", "Medición mensual del ranking"] },
  { k: "03", tag: "Vender", t: "Conector propio", p: "desde USD 2.500", n: "+ mantención", items: ["La IA consulta sus precios y agenda", "Cotiza y reserva dentro del chat", "Para ChatGPT y Claude"] },
];

export function HomeIA() {
  return (
    <>
      <header className="top">
        <div className="wrap top-in">
          <Link className="brand" href="/" aria-label="FRONTIERA">
            {/* eslint-disable-next-line @next/next/no-img-element -- brand asset */}
            <img src="/frontiera-wordmark.webp" alt="FRONTIERA" width={520} height={66} />
          </Link>
          <nav className="nav">
            <a href="#radar">Probar</a>
            <a href="#por-que">Por qué</a>
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

        <section className="sec sec-line" id="por-que">
          <div className="wrap">
            <p className="label mono">{"// "}Por qué</p>
            <h2>De cada 100 búsquedas, cuántas llegan a un sitio.</h2>
            <div className="waffles">
              <Waffle value={15} label="sin respuesta de IA" />
              <Waffle value={8} label="con respuesta de IA" />
              <Waffle value={1} label="clic dentro de la respuesta de IA" hot />
            </div>
            <p className="ia-punch">Cuando la IA responde, <span className="accent">99 de cada 100</span> personas no hacen clic en los enlaces de la respuesta.</p>
            <p className="fine">Visitas a Google que terminan en un clic. Fuente: <a className="link" href={PEW} target="_blank" rel="noopener noreferrer">Pew Research Center, julio 2025</a>, 900 adultos en EE.UU.</p>
          </div>
        </section>

        <section className="sec sec-line" id="oferta">
          <div className="wrap">
            <p className="label mono">{"// "}Oferta</p>
            <h2>Pase del lado derecho.</h2>
            <ol className="path">
              {PLANS.map((p) => (
                <li key={p.k} className="path-step">
                  <span className="path-dot mono">{p.k}</span>
                  <article className="path-card">
                    <span className="path-tag mono">{p.tag}</span>
                    <h3>{p.t}</h3>
                    <ul>{p.items.map((x) => <li key={x}>{x}</li>)}</ul>
                    <div className="path-price"><b className="mono">{p.p}</b><span className="dim mono">{p.n}</span></div>
                  </article>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="finale">
          <div className="wrap finale-in">
            <h2>Que la IA lo recomiende <span className="accent">a usted.</span></h2>
            <a className="btn" href="#contacto">Pedir diagnóstico <span aria-hidden="true">→</span></a>
          </div>
        </section>

        <section className="sec" id="contacto">
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
