"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "@/lib/playground/types";
import type { Copy } from "@/lib/copy";
import { roi } from "@/lib/roi";

type Props = {
  lang: Lang;
  c: Copy["play"]["roi"];
  unit: string;
  defaultVolume: number;
  defaultMinutes: number;
  /** Measured seconds per case for this run, when there is one. */
  flowSeconds?: number | null;
};

const PAD = { l: 8, r: 8, t: 16, b: 26 };

/**
 * A commercial view of an automation, computed only from what the visitor sets:
 * cases a month, minutes per case, cost of an hour, share still reviewed by a person and
 * monthly tool cost. No price of ours and no promised savings are assumed.
 */
export function RoiReport({ lang, c, unit, defaultVolume, defaultMinutes, flowSeconds }: Props) {
  const es = lang === "es";
  const [volume, setVolume] = useState(defaultVolume);
  const [minutes, setMinutes] = useState(defaultMinutes);
  const [rate, setRate] = useState(es ? 8000 : 25);
  const [review, setReview] = useState(10);
  const [tools, setTools] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  /* The SVG is drawn at its real pixel width so text stays 11-12px on any screen. */
  const plotRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(560);
  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(Math.round(e.contentRect.width), 280)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = W < 480 ? 200 : 240;

  const r = useMemo(() => roi({ volume, minutes, rate, review, tools }), [volume, minutes, rate, review, tools]);
  const nf = new Intl.NumberFormat(es ? "es-CL" : "en-US", { maximumFractionDigits: 0 });
  const money = (n: number) => `${es ? "$" : "US$"}${nf.format(Math.round(n))}`;
  const short = (n: number) => {
    const a = Math.abs(n);
    if (a >= 1e6) return `${es ? "$" : "US$"}${(n / 1e6).toLocaleString(es ? "es-CL" : "en-US", { maximumFractionDigits: 1 })}M`;
    if (a >= 1e3) return `${es ? "$" : "US$"}${nf.format(Math.round(n / 1e3))}k`;
    return money(n);
  };

  /* Cumulative cost over 12 months: by hand vs automated. */
  const months = Array.from({ length: 13 }, (_, m) => m);
  const max = Math.max(r.manualMonth * 12, 1);
  const x = (m: number) => PAD.l + (m / 12) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b);
  const line = (per: number) => months.map((m) => `${m ? "L" : "M"}${x(m).toFixed(1)},${y(per * m).toFixed(1)}`).join(" ");
  const gap = `${line(r.manualMonth)} ${months
    .slice()
    .reverse()
    .map((m) => `L${x(m).toFixed(1)},${y(r.autoMonth * m).toFixed(1)}`)
    .join(" ")} Z`;

  const field = (label: string, value: number, set: (n: number) => void, min: number, max: number, step: number, shown: string) => (
    <label className="calc-field">
      <span>{label} <b className="mono">{shown}</b></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} />
    </label>
  );

  const positive = r.netMonth > 0;

  return (
    <div className="roi">
      <div className="roi-kpis">
        <div className="roi-kpi">
          <span className="roi-k">{c.hours}</span>
          <span className="roi-v mono">{nf.format(Math.round(r.hoursMonth))} h</span>
          <span className="roi-s">{c.fte.replace("{n}", (r.hoursMonth / 160).toLocaleString(es ? "es-CL" : "en-US", { maximumFractionDigits: 1 }))}</span>
        </div>
        <div className="roi-kpi roi-kpi-main">
          <span className="roi-k">{c.month}</span>
          <span className="roi-v mono">{positive ? money(r.netMonth) : "0"}</span>
          <span className="roi-s">{c.year} <b className="mono">{positive ? money(r.netMonth * 12) : "0"}</b></span>
        </div>
        <div className="roi-kpi">
          <span className="roi-k">{c.budget}</span>
          <span className="roi-v mono">{positive ? money(r.netMonth * 6) : "0"}</span>
          <span className="roi-s">{c.budgetNote}</span>
        </div>
      </div>

      {flowSeconds ? (
        <div className="roi-case" aria-label={c.perCase}>
          <span className="roi-k">{c.perCase}</span>
          <div className="roi-bar"><i style={{ width: "100%" }} /><span className="mono">{c.byHand} · {minutes} min</span></div>
          <div className="roi-bar roi-bar-auto">
            <i style={{ width: `${Math.max((flowSeconds / (minutes * 60)) * 100, 0.8)}%` }} />
            <span className="mono">{c.automated} · {flowSeconds.toFixed(1)} s · {nf.format(Math.round((minutes * 60) / flowSeconds))}× </span>
          </div>
        </div>
      ) : null}

      <figure className="roi-chart">
        <figcaption className="roi-k">{c.chart}</figcaption>
        <div className="roi-legend mono">
          <span><i className="sw sw-manual" />{c.byHand}</span>
          <span><i className="sw sw-auto" />{c.automated}</span>
          <span><i className="sw sw-gap" />{c.saved}</span>
        </div>
        <div className="roi-plot" ref={plotRef}>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${c.chart}: ${c.byHand} ${money(r.manualMonth * 12)}, ${c.automated} ${money(r.autoMonth * 12)}`} onMouseLeave={() => setHover(null)}>
            {[0.25, 0.5, 0.75, 1].map((t) => (
              <line key={t} x1={PAD.l} x2={W - PAD.r} y1={y(max * t)} y2={y(max * t)} className="grid" />
            ))}
            <line x1={PAD.l} x2={W - PAD.r} y1={y(0)} y2={y(0)} className="axis" />
            {positive && <path d={gap} className="gap" />}
            <path d={line(r.manualMonth)} className="ln ln-manual" />
            <path d={line(r.autoMonth)} className="ln ln-auto" />
            <text x={x(12) - 4} y={y(r.manualMonth * 12) - 6} textAnchor="end" className="lbl">{short(r.manualMonth * 12)}</text>
            <text x={x(12) - 4} y={y(r.autoMonth * 12) - 6} textAnchor="end" className="lbl">{short(r.autoMonth * 12)}</text>
            {[1, 3, 6, 9, 12].map((m) => (
              <text key={m} x={x(m)} y={H - 8} textAnchor="middle" className="tick">{m}</text>
            ))}
            {hover !== null && (
              <>
                <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={y(0)} className="cross" />
                <circle cx={x(hover)} cy={y(r.manualMonth * hover)} r={4} className="dot dot-manual" />
                <circle cx={x(hover)} cy={y(r.autoMonth * hover)} r={4} className="dot dot-auto" />
              </>
            )}
            {months.slice(1).map((m) => (
              <rect key={m} x={x(m - 0.5)} y={0} width={x(1) - x(0)} height={H} fill="transparent" onMouseEnter={() => setHover(m)} onTouchStart={() => setHover(m)} />
            ))}
          </svg>
          {hover !== null && (
            <div className="roi-tip mono" style={{ left: `${Math.min(Math.max((x(hover) / W) * 100, 18), 82)}%` }}>
              <b>{c.monthN.replace("{n}", String(hover))}</b>
              <span><i className="sw sw-manual" />{money(r.manualMonth * hover)}</span>
              <span><i className="sw sw-auto" />{money(r.autoMonth * hover)}</span>
              <span className="accent">{c.saved} {money(Math.max(r.netMonth * hover, 0))}</span>
            </div>
          )}
        </div>
        <p className="roi-axis mono dim">{c.months}</p>
      </figure>

      <div className="roi-inputs">
        {field(unit, volume, setVolume, 10, 5000, 10, nf.format(volume))}
        {field(c.minutes, minutes, setMinutes, 1, 60, 1, `${minutes} min`)}
        {es ? field(c.rate, rate, setRate, 3000, 40000, 500, money(rate)) : field(c.rate, rate, setRate, 10, 120, 5, money(rate))}
        {field(c.review, review, setReview, 0, 50, 5, `${review}%`)}
        {es ? field(c.tools, tools, setTools, 0, 500000, 10000, money(tools)) : field(c.tools, tools, setTools, 0, 500, 10, money(tools))}
      </div>
      <p className="fine">{c.note}</p>
    </div>
  );
}
