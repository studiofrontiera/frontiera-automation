"use client";

import { useRef, useState } from "react";
import type { DemoResult, Lang } from "@/lib/demo";
import { MAX_INPUT } from "@/lib/demo";
import type { Copy } from "@/lib/copy";

type State = { phase: "idle" } | { phase: "running"; step: number } | { phase: "done"; result: DemoResult } | { phase: "error"; message: string };

export function Demo({ lang, c }: { lang: Lang; c: Copy["demo"] }) {
  const [text, setText] = useState(c.sample);
  const [state, setState] = useState<State>({ phase: "idle" });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  async function run() {
    if (state.phase === "running") return;
    let step = 0;
    setState({ phase: "running", step });
    timer.current = setInterval(() => {
      step = Math.min(step + 1, c.steps.length - 1);
      setState((s) => (s.phase === "running" ? { phase: "running", step } : s));
    }, 450);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
      });
      const body = await res.json();
      if (!res.ok) {
        const key = (body?.error as keyof typeof c.errors) ?? "generic";
        setState({ phase: "error", message: c.errors[key] ?? c.errors.generic });
      } else {
        setState({ phase: "done", result: body as DemoResult });
      }
    } catch {
      setState({ phase: "error", message: c.errors.generic });
    } finally {
      if (timer.current) clearInterval(timer.current);
    }
  }

  const active = state.phase === "running" ? state.step : state.phase === "done" ? c.steps.length : -1;
  const lead = state.phase === "done" ? state.result.lead : null;

  return (
    <div className="demo">
      <div className="demo-in">
        <div className="pane-head">
          <span>{c.input}</span>
          <button type="button" className="ghost" onClick={() => { setText(c.sample); setState({ phase: "idle" }); }}>
            {c.reset}
          </button>
        </div>
        <textarea value={text} maxLength={MAX_INPUT} onChange={(e) => setText(e.target.value)} rows={11} spellCheck={false} aria-label={c.input} />
        <div className="demo-actions">
          <button type="button" className="btn" onClick={run} disabled={state.phase === "running"}>
            {state.phase === "running" ? c.running : c.run} <span aria-hidden="true">→</span>
          </button>
          <span className="mono dim">{text.length}/{MAX_INPUT}</span>
        </div>
        <p className="fine">{c.privacy}</p>
      </div>

      <div className="demo-out" aria-live="polite">
        <ol className="pipeline">
          {c.steps.map((s, i) => (
            <li key={s} data-state={i < active ? "done" : i === active ? "run" : "wait"}>
              <span className="dot" />
              {s}
            </li>
          ))}
        </ol>

        {state.phase === "error" && <p className="err">{state.message}</p>}

        {lead && state.phase === "done" ? (
          <div className="result">
            <div className="pane-head">
              <span>{c.out.record}</span>
              <span className={`badge ${state.result.mode}`}>
                {state.result.mode === "ai" ? c.modeAi : c.modeRules} · {(state.result.ms / 1000).toFixed(1)} s
              </span>
            </div>
            <dl className="record mono">
              <div><dt>{c.out.name}</dt><dd>{lead.name ?? "null"}</dd></div>
              <div><dt>{c.out.company}</dt><dd>{lead.company ?? "null"}</dd></div>
              <div><dt>{c.out.email}</dt><dd>{lead.email ?? "null"}</dd></div>
              <div><dt>{c.out.phone}</dt><dd>{lead.phone ?? "null"}</dd></div>
              <div><dt>{c.out.intent}</dt><dd className="hl">{c.intents[lead.intent]}</dd></div>
              <div><dt>{c.out.urgency}</dt><dd className={`u-${lead.urgency}`}>{c.urgencies[lead.urgency]}</dd></div>
            </dl>
            <p className="summary">{lead.summary}</p>
            <h4>{c.out.tasks}</h4>
            <ul className="tasks">
              {lead.tasks.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <h4>{c.out.reply}</h4>
            <pre className="reply">{lead.reply}</pre>
          </div>
        ) : (
          state.phase !== "error" && (
            <div className="placeholder mono">
              {state.phase === "running" ? "▍" : "{ }"}
            </div>
          )
        )}
      </div>
    </div>
  );
}
