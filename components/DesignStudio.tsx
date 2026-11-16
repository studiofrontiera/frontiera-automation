"use client";

import { useState } from "react";
import { MAX_DESIGN_INPUT, designSamples, designToN8n, type Design } from "@/lib/playground/design";
import type { Lang } from "@/lib/playground/types";
import type { Copy } from "@/lib/copy";
import { download } from "@/lib/download";

type State = { kind: "idle" } | { kind: "running" } | { kind: "done"; design: Design; mode: "ai" | "rules"; ms: number } | { kind: "error"; message: string };

export function DesignStudio({ lang, c }: { lang: Lang; c: Copy["play"] }) {
  const d = c.design;
  const [text, setText] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function run() {
    if (state.kind === "running") return;
    setState({ kind: "running" });
    try {
      const res = await fetch("/api/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) setState({ kind: "error", message: c.errors[body?.error as keyof typeof c.errors] ?? c.errors.generic });
      else setState({ kind: "done", design: body.design, mode: body.mode, ms: body.ms });
    } catch {
      setState({ kind: "error", message: c.errors.generic });
    }
  }

  /* Hands the draft to the contact form below, so the visitor does not retype it. */
  function want(design: Design) {
    const box = document.querySelector<HTMLTextAreaElement>('#contacto textarea[name="message"]');
    if (box) {
      box.value = `${d.ctaMessage} ${design.title}\n\n${text.trim()}`;
      box.closest("section")?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => box.focus(), 500);
    }
  }

  const kindLabel = (k: string) => (k === "human" ? c.kindsExtra.human : c.kinds[k as keyof typeof c.kinds]);

  return (
    <div className="design">
      <p className="pg-blurb">{d.title}</p>
      <div className="pane">
        <textarea
          value={text}
          maxLength={MAX_DESIGN_INPUT}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={d.placeholder}
          aria-label={d.title}
        />
        <div className="ideas">
          <span className="mono dim">{d.samples}:</span>
          {designSamples[lang].map((s, i) => (
            <button key={i} type="button" className="ghost" onClick={() => setText(s)}>{s.split(/[,.:]/)[0].slice(0, 48)}…</button>
          ))}
        </div>
        <div className="pane-foot">
          <button type="button" className="btn" onClick={run} disabled={state.kind === "running" || text.trim().length < 20}>
            {state.kind === "running" ? d.running : d.run} <span aria-hidden="true">✦</span>
          </button>
          <span className="mono dim">{text.length}/{MAX_DESIGN_INPUT}</span>
        </div>
        <p className="fine">{c.privacy}</p>
      </div>

      <div aria-live="polite">
        {state.kind === "error" && <p className="err">{state.message}</p>}
        {state.kind === "running" && <div className="placeholder mono">▍</div>}
        {state.kind === "done" && (
          <div className="design-out">
            <div className="meta mono">
              <span className={`badge badge-${state.mode}`}>{state.mode === "ai" ? c.modeAi : c.modeRules}</span>
              <span className="dim">{(state.ms / 1000).toFixed(1)} s</span>
            </div>
            <h3 className="design-title">{state.design.title}</h3>
            <p className="dim">{state.design.summary}</p>

            <p className="mono dim small">{d.steps}</p>
            <ol className="dflow">
              {state.design.steps.map((s, i) => (
                <li key={i} className="node" data-kind={s.kind} data-state="done">
                  <span className="node-kind mono">{String(i + 1).padStart(2, "0")} · {kindLabel(s.kind)}</span>
                  <span className="node-title">{s.title}</span>
                  <span className="node-tool mono">{s.tool}</span>
                  <span className="node-detail">{s.detail}</span>
                </li>
              ))}
            </ol>

            <div className="dgrid">
              {([["data", d.data], ["rules", d.rules], ["risks", d.risks], ["questions", d.questions]] as const).map(([k, label]) =>
                state.design[k].length ? (
                  <div key={k} className="pane">
                    <p className="mono dim small top0">{label}</p>
                    <ul className="tasks">{state.design[k].map((x, i) => <li key={i}>{x}</li>)}</ul>
                  </div>
                ) : null
              )}
            </div>

            <div className="design-actions">
              <button type="button" className="btn" onClick={() => want(state.design)}>{d.cta} <span aria-hidden="true">→</span></button>
              <button type="button" className="ghost" onClick={() => download("frontiera-draft.n8n.json", designToN8n(state.design, lang))}>↓ {c.exportN8n}</button>
            </div>
            <p className="fine">{d.note}</p>
          </div>
        )}
      </div>
    </div>
  );
}
