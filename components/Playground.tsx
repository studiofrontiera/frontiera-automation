"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_INPUT, SCENARIOS } from "@/lib/playground";
import type { FieldView, JsonObject, JsonValue, Lang, RunResult, Scenario } from "@/lib/playground/types";
import type { Copy } from "@/lib/copy";
import { JsonView } from "./JsonView";

type Phase = { kind: "idle" } | { kind: "running"; step: number } | { kind: "done"; result: RunResult } | { kind: "error"; message: string };

const STEP_MS = 420;

export function Playground({ lang, c }: { lang: Lang; c: Copy["play"] }) {
  const [scenario, setScenario] = useState<Scenario>(SCENARIOS[0]);
  const [text, setText] = useState(SCENARIOS[0].sample[lang]);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [selected, setSelected] = useState(3);
  const [tab, setTab] = useState<"view" | "json">("view");
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Deep link: ?s=invoice opens that scenario. Read once on mount, no Suspense needed. */
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("s");
    const found = SCENARIOS.find((s) => s.id === id);
    if (found) pick(found);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pick(s: Scenario) {
    setScenario(s);
    setText(s.sample[lang]);
    setPhase({ kind: "idle" });
    setSelected(3);
  }

  async function run() {
    if (phase.kind === "running") return;
    let step = 0;
    setPhase({ kind: "running", step });
    timer.current = setInterval(() => {
      step = Math.min(step + 1, scenario.nodes.length - 1);
      setPhase((p) => (p.kind === "running" ? { kind: "running", step } : p));
    }, STEP_MS);
    const minDelay = new Promise((r) => setTimeout(r, STEP_MS * scenario.nodes.length));
    try {
      const res = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: scenario.id, text, lang }),
      });
      const body = await res.json();
      await minDelay;
      if (!res.ok) {
        const msg = c.errors[body?.error as keyof typeof c.errors] ?? c.errors.generic;
        setPhase({ kind: "error", message: msg });
      } else {
        setPhase({ kind: "done", result: body as RunResult });
        setSelected(3);
      }
    } catch {
      setPhase({ kind: "error", message: c.errors.generic });
    } finally {
      if (timer.current) clearInterval(timer.current);
    }
  }

  async function share() {
    const url = `${window.location.origin}${window.location.pathname}?s=${scenario.id}#playground`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.history.replaceState(null, "", url);
    }
  }

  const result = phase.kind === "done" ? phase.result : null;
  const nodeState = (i: number) =>
    phase.kind === "running" ? (i < phase.step ? "done" : i === phase.step ? "run" : "wait") : result ? "done" : "wait";

  const nodeData: JsonValue[] = result
    ? [{ ...result.trigger, text: text.slice(0, 160) + (text.length > 160 ? "…" : "") }, result.extracted, result.decision as unknown as JsonObject, result.payload]
    : [];

  return (
    <div className="pg">
      <div className="pg-tabs" role="tablist">
        {SCENARIOS.map((s) => (
          <button key={s.id} role="tab" aria-selected={s.id === scenario.id} className="pg-tab" onClick={() => pick(s)}>
            {s.label[lang]}
          </button>
        ))}
        <button type="button" className="ghost pg-share" onClick={share}>
          {copied ? c.copied : c.share}
        </button>
      </div>
      <p className="pg-blurb">{scenario.blurb[lang]}</p>

      <ol className="flow" aria-label="workflow">
        {scenario.nodes.map((n, i) => (
          <li key={i} className="flow-item">
            <button
              type="button"
              className="node"
              data-state={nodeState(i)}
              data-kind={n.kind}
              aria-pressed={!!result && selected === i}
              disabled={!result}
              onClick={() => setSelected(i)}
            >
              <span className="node-kind mono">{c.kinds[n.kind]}</span>
              <span className="node-title">{n.title[lang]}</span>
              <span className="node-tool mono">{n.tool}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="pg-grid">
        <div className="pane">
          <div className="pane-head">
            <span className="mono">{c.input}</span>
            <button type="button" className="ghost" onClick={() => pick(scenario)}>{c.reset}</button>
          </div>
          <textarea value={text} maxLength={MAX_INPUT} onChange={(e) => setText(e.target.value)} rows={12} spellCheck={false} aria-label={c.input} />
          <div className="pane-foot">
            <button type="button" className="btn" onClick={run} disabled={phase.kind === "running"}>
              {phase.kind === "running" ? c.running : c.run} <span aria-hidden="true">→</span>
            </button>
            <span className="mono dim">{text.length}/{MAX_INPUT}</span>
          </div>
          <p className="fine">{c.privacy}</p>
        </div>

        <div className="pane" aria-live="polite">
          <div className="pane-head">
            <span className="mono">{result ? `${String(selected + 1).padStart(2, "0")} · ${scenario.nodes[selected].title[lang]}` : c.nodeHint}</span>
            {result && (
              <span className="seg">
                <button type="button" aria-pressed={tab === "view"} onClick={() => setTab("view")}>{c.view}</button>
                <button type="button" aria-pressed={tab === "json"} onClick={() => setTab("json")}>{c.json}</button>
              </span>
            )}
          </div>

          {phase.kind === "error" && <p className="err">{phase.message}</p>}
          {phase.kind !== "done" && phase.kind !== "error" && (
            <div className="placeholder mono">{phase.kind === "running" ? "▍" : c.waiting}</div>
          )}

          {result && (
            <>
              <div className="meta mono">
                <span className={`badge badge-${result.mode}`}>{result.mode === "ai" ? c.modeAi : c.modeRules}</span>
                <span className="dim">{(result.ms / 1000).toFixed(1)} s</span>
              </div>
              {tab === "json" ? (
                <JsonView value={nodeData[selected]} />
              ) : (
                <HumanView index={selected} result={result} scenario={scenario} lang={lang} c={c} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function HumanView({ index, result, scenario, lang, c }: { index: number; result: RunResult; scenario: Scenario; lang: Lang; c: Copy["play"] }) {
  if (index === 0) {
    return (
      <dl className="record mono">
        {Object.entries(result.trigger).map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>
        ))}
      </dl>
    );
  }
  if (index === 1) return <Fields fields={scenario.fields} data={result.extracted} lang={lang} />;
  if (index === 2) {
    return (
      <div className="decision">
        <p className="mono dim small">{c.decision}</p>
        <p className="decision-out mono">{result.decision.outcome}</p>
        <p>{result.decision.reason}</p>
        <p className="mono dim small">{c.checks}</p>
        <ul className="checks">
          {result.decision.checks.map((ch) => (
            <li key={ch.label} data-ok={ch.ok}>{ch.label}</li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div>
      <p className="decision-line">
        <span className="mono accent">{result.decision.outcome}</span> · {result.decision.reason}
      </p>
      <p className="mono dim small">{c.payload}</p>
      <JsonView value={result.payload} />
    </div>
  );
}

function Fields({ fields, data, lang }: { fields: FieldView[]; data: JsonObject; lang: Lang }) {
  const short = fields.filter((f) => !f.as || f.as === "badge" || f.as === "money");
  const long = fields.filter((f) => f.as === "list" || f.as === "block");
  const money = (v: JsonValue) => (typeof v === "number" ? v.toLocaleString(lang === "es" ? "es-CL" : "en-US") : "null");
  return (
    <>
      <dl className="record mono">
        {short.map((f) => {
          const v = data[f.key];
          return (
            <div key={f.key}>
              <dt>{f.label[lang]}</dt>
              <dd className={f.as === "badge" ? `tag tag-${String(v)}` : undefined}>{f.as === "money" ? money(v) : v === null ? "null" : String(v)}</dd>
            </div>
          );
        })}
      </dl>
      {long.map((f) => {
        const v = data[f.key];
        return (
          <div key={f.key} className="long">
            <p className="mono dim small">{f.label[lang]}</p>
            {Array.isArray(v) ? (
              <ul className="tasks">
                {v.map((x, i) => (
                  <li key={i}>
                    {x && typeof x === "object" && !Array.isArray(x)
                      ? `${String(x.description ?? "")}${typeof x.amount === "number" ? `: ${money(x.amount)}` : ""}`
                      : String(x)}
                  </li>
                ))}
              </ul>
            ) : (
              <pre className="reply">{v === null ? "null" : String(v)}</pre>
            )}
          </div>
        );
      })}
    </>
  );
}
