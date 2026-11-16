import Link from "next/link";
import type { Lang } from "@/lib/demo";
import { COPY, FORM_ACTION, STACK, WHATSAPP } from "@/lib/copy";
import { Demo } from "./Demo";
import { Calculator } from "./Calculator";

export function Home({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  const other: Lang = lang === "es" ? "en" : "es";
  const home = lang === "es" ? "/" : "/en";
  const privacy = lang === "es" ? "/privacidad" : "/en/privacy";

  return (
    <>
      <header className="top">
        <div className="wrap top-in">
          <Link className="brand" href={home} aria-label="FRONTIERA">
            {/* eslint-disable-next-line @next/next/no-img-element -- brand asset */}
            <img src="/frontiera-wordmark.webp" alt="FRONTIERA" width={520} height={66} />
            <span className="brand-tag mono">{c.tag}</span>
          </Link>
          <nav className="nav">
            <a href="#demo">{c.nav.demo}</a>
            <a href="#servicios">{c.nav.services}</a>
            <a href="#proceso">{c.nav.process}</a>
          </nav>
          <div className="top-act">
            <Link className="mono lang" href={other === "es" ? "/" : "/en"} hrefLang={other}>
              {other.toUpperCase()}
            </Link>
            <a className="btn btn-sm" href="#contacto">{c.nav.contact}</a>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="grid-bg" aria-hidden="true" />
          <div className="wrap hero-in">
            <div>
              <p className="kicker mono">{c.hero.kicker}</p>
              <h1>
                <span>{c.hero.title[0]}</span>
                <span className="accent">{c.hero.title[1]}</span>
              </h1>
              <p className="lead">{c.hero.lead}</p>
              <div className="cta-row">
                <a className="btn" href="#demo">{c.hero.cta} <span aria-hidden="true">→</span></a>
                <a className="link" href="#contacto">{c.hero.cta2}</a>
              </div>
            </div>
            <div className="term" aria-hidden="true">
              <div className="term-bar"><i /><i /><i /><span className="mono">workflow.log</span></div>
              <ol className="mono">
                {c.term.map(([time, tag, msg], i) => (
                  <li key={i} style={{ animationDelay: `${0.35 + i * 0.45}s` }}>
                    <span className="dim">{time}</span> <span className={`t-${tag}`}>[{tag}]</span> {msg}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="sec" id="demo">
          <div className="wrap">
            <p className="label mono">{"// "}{c.demo.label}</p>
            <h2>{c.demo.title}</h2>
            <p className="sub">{c.demo.lead}</p>
            <Demo lang={lang} c={c.demo} />
          </div>
        </section>

        <section className="sec sec-line" id="servicios">
          <div className="wrap">
            <h2>{c.servicesTitle}</h2>
            <div className="cards">
              {c.services.map((s) => (
                <article className="card" key={s.k}>
                  <span className="mono accent">{s.k}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                  <ul>
                    {s.list.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <div className="stack">
              <span className="mono dim">{c.stackTitle}:</span>
              {STACK.map((s) => (
                <span className="chip mono" key={s}>{s}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="sec sec-line">
          <div className="wrap">
            <p className="label mono">{"// "}{c.calc.label}</p>
            <h2>{c.calc.title}</h2>
            <Calculator lang={lang} c={c.calc} />
          </div>
        </section>

        <section className="sec sec-line" id="proceso">
          <div className="wrap">
            <h2>{c.processTitle}</h2>
            <ol className="steps">
              {c.process.map(([t, b], i) => (
                <li key={t}>
                  <span className="mono accent">0{i + 1}</span>
                  <h3>{t}</h3>
                  <p>{b}</p>
                </li>
              ))}
            </ol>
            <ul className="rules mono">
              {c.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="sec sec-line" id="contacto">
          <div className="wrap contact">
            <div>
              <h2>{c.contact.title}</h2>
              <p className="sub">{c.contact.lead}</p>
              <a className="link" href={WHATSAPP[lang]} target="_blank" rel="noopener noreferrer">
                {c.contact.whatsapp} →
              </a>
            </div>
            <form className="form" action={FORM_ACTION} method="post">
              <input type="hidden" name="_subject" value={c.contact.subject} />
              <input type="hidden" name="_template" value="table" />
              <input type="hidden" name="_next" value={`https://www.frontiera.cl${home === "/" ? "/" : "/en"}?enviado=1#contacto`} />
              <input type="text" name="_honey" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <div className="row">
                <label><span>{c.contact.name}</span><input name="name" required autoComplete="name" /></label>
                <label><span>{c.contact.email}</span><input name="email" type="email" required autoComplete="email" /></label>
              </div>
              <div className="row">
                <label><span>{c.contact.company}</span><input name="company" autoComplete="organization" /></label>
                <label><span>{c.contact.tools}</span><input name="tools" placeholder={c.contact.toolsHint} /></label>
              </div>
              <label><span>{c.contact.message}</span><textarea name="message" rows={5} required /></label>
              <button className="btn" type="submit">{c.contact.send} <span aria-hidden="true">→</span></button>
            </form>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot-in mono">
          <span>{c.foot.line}</span>
          <Link href={privacy}>{c.foot.privacy}</Link>
        </div>
      </footer>
    </>
  );
}
