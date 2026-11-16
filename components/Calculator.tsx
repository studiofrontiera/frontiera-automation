"use client";

import { useState } from "react";
import type { Lang } from "@/lib/demo";
import type { Copy } from "@/lib/copy";

const WEEKS_PER_MONTH = 4.33;

export function Calculator({ lang, c }: { lang: Lang; c: Copy["calc"] }) {
  const [people, setPeople] = useState(3);
  const [hours, setHours] = useState(6);
  const [cost, setCost] = useState(lang === "es" ? 8000 : 25);
  const [share, setShare] = useState(60);

  const monthHours = people * hours * WEEKS_PER_MONTH * (share / 100);
  const money = monthHours * cost;
  const fmt = new Intl.NumberFormat(lang === "es" ? "es-CL" : "en-US", { maximumFractionDigits: 0 });

  const field = (label: string, value: number, set: (n: number) => void, min: number, max: number, step: number, suffix = "") => (
    <label className="calc-field">
      <span>
        {label} <b className="mono">{fmt.format(value)}{suffix}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} />
    </label>
  );

  return (
    <div className="calc">
      <div className="calc-inputs">
        {field(c.people, people, setPeople, 1, 30, 1)}
        {field(c.hours, hours, setHours, 1, 40, 1)}
        {lang === "es" ? field(c.cost, cost, setCost, 3000, 40000, 500) : field(c.cost, cost, setCost, 10, 120, 5)}
        {field(c.share, share, setShare, 10, 90, 5, "%")}
      </div>
      <div className="calc-out">
        <div>
          <span className="big mono">{fmt.format(monthHours)}</span>
          <span className="dim">{c.perMonth}</span>
        </div>
        <div>
          <span className="big mono accent">{fmt.format(money)}</span>
          <span className="dim">{c.money}</span>
        </div>
        <p className="fine">{c.note}</p>
      </div>
    </div>
  );
}
