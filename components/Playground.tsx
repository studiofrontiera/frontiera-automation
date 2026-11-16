"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FILE_TYPES, MAX_FILE_BYTES, MAX_INPUT, SCENARIOS, complete, defaults } from "@/lib/playground";
import { toN8n } from "@/lib/playground/n8n";
import { toMake } from "@/lib/playground/make";
import { PartnerLinks } from "./PartnerLinks";
import { RoiReport } from "./RoiReport";
import type { FieldView, JsonObject, JsonValue, Lang, RunResult, Scenario, Settings } from "@/lib/playground/types";
import type { Copy } from "@/lib/copy";
import { download } from "@/lib/download";
import { JsonView } from "./JsonView";
import { DesignStudio } from "./DesignStudio";

type Phase = { kind: "idle" } | { kind: "running"; step: number } | { kind: "done"; result: RunResult } | { kind: "error"; message: string };
type Upload = { name: string; type: string; data: string; size: number };

const STEP_MS = 420;
const DESIGN = "design";

export function Playground({ lang, c }: { lang: Lang; c: Copy["play"] }) {
  const [tabId, setTabId] = useState<string>(SCENARIOS[0].id);
  const scenario = SCENARIOS.find((s) => s.id === tabId) ?? SCENARIOS[0];
  const [text, setText] = useState(SCENARIOS[0].sample[lang]);
  const [isEdge, setIsEdge] = useState(false);
  const [file, setFile] = useState<Upload | null>(null);
  const [settings, setSettings] = useState<Settings>(defaults(SCENARIOS[0]));
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [selected, setSelected] = useState(3);
  const [tab, setTab] = useState<"view" | "json">("view");
  const [copied, setCopied] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Deep link: ?s=invoice (or ?s=design) opens that tab. Read once on mount. */
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("s");
    if (id === DESIGN) setTabId(DESIGN);
    else {
      const found = SCENARIOS.find((s) => s.id === id);
      if (found) pick(found);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pick(s: Scenario, edge = false) {
    setTabId(s.id);
    setText(edge ? s.edge[lang] : s.sample[lang]);
    setIsEdge(edge);
    setFile(null);
    setFileError(null);
    if (s.id !== scenario.id) {
      setSettings(defaults(s));
    }
    setPhase({ kind: "idle" });
    setSelected(3);
  }

  function onFile(f: File | undefined) {
    setFileError(null);
    if (!f) return;
    if (!(FILE_TYPES as readonly string[]).includes(f.type)) return setFileError(c.errors.file_type);
    if (f.size > MAX_FILE_BYTES) return setFileError(c.errors.file_size);
    const reader = new FileReader();
    reader.onload = () => {
      setFile({ name: f.name, type: f.type, data: String(reader.result), size: f.size });
      setIsEdge(false);
      setPhase({ kind: "idle" });
    };
    reader.readAsDataURL(f);
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
        body: JSON.stringify(
          file
            ? { scenario: scenario.id, lang, settings, file: { name: file.name, type: file.type, data: file.data } }
            : { scenario: scenario.id, text, lang, settings }
        ),
      });
      const body = await res.json().catch(() => ({}));
      await minDelay;
      if (!res.ok) {
        const msg = c.errors[body?.error as keyof typeof c.errors] ?? c.errors.generic;
        setPhase({ kind: "error", message: msg });
      } else {
        setPhase({ kind: "done", result: body as RunResult });
        setSelected(2);
      }
    } catch {
      setPhase({ kind: "error", message: c.errors.generic });
    } finally {
      if (timer.current) clearInterval(timer.current);
    }
  }

  async function share() {
    const url = `${window.location.origin}${window.location.pathname}?s=${tabId}#playground`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.history.replaceState(null, "", url);
    }
  }

  const raw = phase.kind === "done" ? phase.result : null;
  /* Sliders re-run the deterministic rule and action in the browser; the AI output stays. */
  const result = useMemo(
    () => (raw ? { ...complete(scenario, raw.source, raw.extracted, raw.mode, raw.ms, lang, settings), trigger: raw.trigger } : null),
    [raw, scenario, lang, settings]
  );

  const nodeState = (i: number) =>
    phase.kind === "running" ? (i < phase.step ? "done" : i === phase.step ? "run" : "wait") : result ? "done" : "wait";

  const nodeData: JsonValue[] = result
    ? [{ ...result.trigger, text: result.source.slice(0, 400) + (result.source.length > 400 ? "…" : "") }, result.extracted, result.decision as unknown as JsonObject, result.payload]
    : [];

  return (
    <div className="pg">
      <div className="pg-tabs" role="tablist">
        {SCENARIOS.map((s) => (
          <button key={s.id} role="tab" aria-selected={s.id === tabId} className="pg-tab" onClick={() => pick(s)}>
            {s.label[lang]}
          </button>
        ))}
        <button role="tab" aria-selected={tabId === DESIGN} className="pg-tab pg-tab-new" onClick={() => setTabId(DESIGN)}>
          {c.designTab}
        </button>
        <button type="button" className="ghost pg-share" onClick={share}>
          {copied ? c.copied : c.share}
        </button>
      </div>

      {tabId === DESIGN ? (
        <DesignStudio lang={lang} c={c} />
      ) : (
        <>
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
                  <span className="node-tool mono">{i === 0 && file ? "PDF / image" : n.tool}</span>
                </button>
              </li>
            ))}
          </ol>

          <div className="pg-grid">
            <div className="pane">
              <div className="pane-head">
                <span className="mono">{c.input}</span>
                <span className="pane-actions">
                  <button type="button" className="ghost" aria-pressed={!isEdge && !file} onClick={() => pick(scenario)}>{c.sample}</button>
                  <button type="button" className="ghost ghost-warn" aria-pressed={isEdge} onClick={() => pick(scenario, true)}>⚡ {c.edge}</button>
                </span>
              </div>
              {isEdge && <p className="edge-note">{scenario.edgeNote[lang]}</p>}
              {file ? (
                <div className="file-chip">
                  <span className="mono">{file.type === "application/pdf" ? "PDF" : "IMG"}</span>
                  <span className="file-name">{file.name}</span>
                  <span className="dim mono">{(file.size / 1024).toFixed(0)} KB</span>
                  <button type="button" className="ghost" onClick={() => setFile(null)}>{c.removeFile}</button>
                </div>
              ) : (
                <textarea value={text} maxLength={MAX_INPUT} onChange={(e) => { setText(e.target.value); setIsEdge(false); }} rows={12} spellCheck={false} aria-label={c.input} />
              )}
              <div className="pane-foot">
                <button type="button" className="btn" onClick={run} disabled={phase.kind === "running"}>
                  {phase.kind === "running" ? c.running : c.run} <span aria-hidden="true">→</span>
                </button>
                {scenario.acceptsFiles ? (
                  <label className="ghost upload">
                    {c.upload}
                    <input type="file" accept={FILE_TYPES.join(",")} onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
                  </label>
                ) : (
                  <span className="mono dim">{text.length}/{MAX_INPUT}</span>
                )}
              </div>
              {fileError && <p className="err">{fileError}</p>}
              <p className="fine">{scenario.acceptsFiles ? `${c.fileHint} ` : ""}{c.privacy}</p>
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

          <section className="pane roi-pane" aria-label={c.roi.title}>
            <div className="pane-head"><span className="mono">{c.roi.title}</span>{result && <span className={`badge badge-${result.mode}`}>{result.decision.outcome}</span>}</div>
            <RoiReport
              key={scenario.id}
              lang={lang}
              c={c.roi}
              unit={scenario.volumeUnit[lang]}
              defaultVolume={scenario.monthlyVolume}
              defaultMinutes={scenario.manualMinutes}
              flowSeconds={result ? Math.max(result.ms / 1000, 1) : null}
            />
          </section>

          <div className="pg-under">
            <div className="pane">
              <div className="pane-head"><span className="mono">{c.rulesTitle}</span></div>
              <p className="fine top0">{c.rulesHint}</p>
              <div className="sliders">
                {scenario.settings.map((s) => (
                  <label key={s.key} className="calc-field">
                    <span>{s.label[lang]} <b>{settings[s.key].toLocaleString(lang === "es" ? "es-CL" : "en-US")} {s.unit}</b></span>
                    <input
                      type="range"
                      min={s.min}
                      max={s.max}
                      step={s.step}
                      value={settings[s.key]}
                      onChange={(e) => setSettings((p) => ({ ...p, [s.key]: Number(e.target.value) }))}
                    />
                  </label>
                ))}
              </div>
              <div className="pane-foot">
                <button type="button" className="ghost" onClick={() => download(`frontiera-${scenario.id}.n8n.json`, toN8n(scenario, settings, lang))}>
                  ↓ {c.exportN8n}
                </button>
                <button type="button" className="ghost" onClick={() => download(`frontiera-${scenario.id}.make.json`, toMake(scenario, settings, lang))}>
                  ↓ {c.exportMake}
                </button>
              </div>
              <p className="fine">{c.exportHint}</p>
              <PartnerLinks c={c} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function HumanView({ index, result, scenario, lang, c }: { index: number; result: RunResult; scenario: Scenario; lang: Lang; c: Copy["play"] }) {
  if (index === 0) {
    const fromFile = typeof result.trigger.file === "string";
    return (
      <>
        <dl className="record mono">
          {Object.entries(result.trigger).map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>
          ))}
        </dl>
        {fromFile && (
          <div className="long">
            <p className="mono dim small">{c.fileRead}</p>
            <pre className="reply">{result.source}</pre>
          </div>
        )}
      </>
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
              <dd className={f.as === "badge" ? `tag tag-${String(v)}` : v === null ? "null" : undefined}>{f.as === "money" ? money(v) : v === null ? "null" : String(v)}</dd>
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
