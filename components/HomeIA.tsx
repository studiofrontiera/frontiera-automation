import Link from "next/link";
import { FORM_ACTION, WHATSAPP } from "@/lib/copy";
import { AiRadar } from "./AiRadar";

const PEW = "https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/";

const PLANS = [
  { k: "01", t: "Diagnóstico IA", p: "USD 290", n: "una vez · 5 días", b: "Hacemos a ChatGPT, Claude, Gemini y Perplexity las 20 preguntas que hacen sus clientes. Informe: dónde aparece usted, dónde su competencia y por qué." },
  { k: "02", t: "Presencia IA", p: "USD 900", n: "+ USD 150 al mes", b: "Reescribimos su información para que la IA la entienda y la cite: hechos claros, preguntas frecuentes, datos estructurados, llms.txt y fichas en las fuentes que la IA consulta. Medición mensual." },
  { k: "03", t: "Conector propio", p: "desde USD 2.500", n: "+ mantención", b: "Su catálogo, precios o agenda disponibles dentro de ChatGPT y Claude. El asistente del cliente consulta y cotiza con usted directamente." },
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
            <a href="#radar">Radar IA</a>
            <a href="#conector">Conector</a>
            <a href="#oferta">Oferta</a>
          </nav>
          <div className="top-act"><a className="btn btn-sm" href="#contacto">Diagnóstico</a></div>
        </div>
      </header>

      <main>
        <section className="hero ia-hero">
          <div className="grid-bg" aria-hidden="true" />
          <div className="wrap">
            <p className="kicker mono">Empresas B2B · Chile</p>
            <h1 className="ia-h1">Su <s>sitio web</s> <span className="accent">ya no vende.</span></h1>
            <p className="lead">Sus clientes le preguntan a ChatGPT, Claude o Gemini y eligen dentro de la respuesta. Si su empresa no está ahí, no existe para ellos.</p>
            <p className="ia-irony mono">{"// "}Usted está leyendo un sitio. Sus clientes ya no.</p>
            <div className="cta-row"><a className="btn" href="#radar">¿La IA me recomienda? <span aria-hidden="true">→</span></a></div>
          </div>
        </section>

        <section className="sec" id="radar">
          <div className="wrap">
            <p className="label mono">{"// "}Radar IA · en vivo</p>
            <h2>Pregúntele a la IA por su rubro.</h2>
            <p className="sub">Hacemos cinco preguntas que haría un cliente real y contamos cuántas veces la IA lo nombra a usted y cuántas a su competencia.</p>
            <AiRadar />
          </div>
        </section>

        <section className="sec sec-line">
          <div className="wrap">
            <p className="label mono">{"// "}Por qué</p>
            <h2>Cuando responde la IA, nadie hace clic.</h2>
            <div className="ia-stats">
              <div><b className="mono">15%</b><span>hace clic en un resultado cuando no hay resumen de IA</span></div>
              <div><b className="mono">8%</b><span>hace clic cuando sí hay resumen de IA</span></div>
              <div className="hot"><b className="mono">1%</b><span>hace clic en un enlace dentro del resumen</span></div>
            </div>
            <p className="fine">Fuente: <a className="link" href={PEW} target="_blank" rel="noopener noreferrer">Pew Research Center, julio 2025</a>, búsquedas en Google de 900 adultos en EE.UU.</p>
            <div className="ia-flows mono">
              <div className="old"><span className="yr">2007</span><i>Busca</i>→<i>10 enlaces</i>→<i>Abre sitios</i>→<i>Formulario</i>→<i>Espera</i></div>
              <div><span className="yr">Hoy</span><i>Pregunta a la IA</i>→<i>2 o 3 nombres</i>→<i>Elige</i></div>
              <div><span className="yr">Pronto</span><i>Su asistente cotiza y reserva por él</i>→<i>Listo</i></div>
            </div>
          </div>
        </section>

        <section className="sec sec-line" id="conector">
          <div className="wrap ia-split">
            <div>
              <p className="label mono">{"// "}Qué es un conector</p>
              <h2>Su empresa, dentro de la IA.</h2>
              <p className="sub">Un conector deja que ChatGPT o Claude consulten su catálogo, precios o agenda en tiempo real y respondan al cliente con sus datos, no con suposiciones.</p>
              <div className="ia-diagram mono" aria-label="Cliente, asistente de IA, su conector, sus sistemas">
                <span>Cliente</span><em>→</em><span>ChatGPT · Claude</span><em>→</em><span className="hot">Su conector</span><em>→</em><span>Catálogo · Precios · Agenda</span>
              </div>
            </div>
            <div className="ia-chat" aria-label="Ejemplo: conector Licitaciones Chile de FRONTIERA">
              <div className="ia-chat-bar mono"><span>Asistente</span><span className="accent">Licitaciones Chile · FRONTIERA</span></div>
              <p className="ia-q">¿Qué licitaciones de video cierran esta semana?</p>
              <p className="ia-call mono">buscar_licitaciones(&quot;video audiovisual&quot;)</p>
              <div className="ia-a">
                Encontré 3 en Mercado Público:
                <ol><li>Grabación de video institucional · cierra vie 12:00</li><li>Producción audiovisual para campaña · cierra lun 15:00</li><li>Registro de eventos · cierra mar 18:00</li></ol>
              </div>
              <p className="fine mono">Nuestro propio conector. Ejemplo ilustrativo.</p>
            </div>
          </div>
        </section>

        <section className="sec sec-line" id="oferta">
          <div className="wrap">
            <p className="label mono">{"// "}Oferta</p>
            <h2>Tres pasos para estar en la respuesta.</h2>
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

        <section className="sec sec-line">
          <div className="wrap">
            <p className="label mono">{"// "}Hacia dónde va</p>
            <h2>Nuestra lectura de los próximos años.</h2>
            <ol className="steps ia-steps3">
              <li><span className="mono accent">3 años</span><h3>La IA cita 2 o 3 empresas</h3><p>El cliente pregunta y elige entre los nombres de la respuesta. Gana la empresa citada.</p></li>
              <li><span className="mono accent">5 años</span><h3>El asistente compra</h3><p>Cotiza, compara y reserva solo. Gana la empresa a la que puede conectarse.</p></li>
              <li><span className="mono accent">10 años</span><h3>Venta entre agentes</h3><p>El sitio web queda como prueba de que la empresa existe.</p></li>
            </ol>
          </div>
        </section>

        <section className="sec sec-line" id="contacto">
          <div className="wrap contact">
            <div>
              <h2>Empiece por saber dónde está.</h2>
              <p className="sub">Pida el diagnóstico IA. Respondemos en un día hábil.</p>
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
