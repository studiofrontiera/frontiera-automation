import type { ReactNode } from "react";
import type { JsonValue } from "@/lib/playground/types";

/** Small, dependency-free JSON renderer with token colouring. */
export function JsonView({ value }: { value: JsonValue }) {
  return <pre className="json">{render(value, 0)}</pre>;
}

function render(v: JsonValue, depth: number): ReactNode {
  const pad = "  ".repeat(depth);
  const inner = "  ".repeat(depth + 1);
  if (v === null) return <span className="j-null">null</span>;
  if (typeof v === "string") return <span className="j-str">{JSON.stringify(v)}</span>;
  if (typeof v === "number") return <span className="j-num">{v}</span>;
  if (typeof v === "boolean") return <span className="j-bool">{String(v)}</span>;
  if (Array.isArray(v)) {
    if (!v.length) return "[]";
    return (
      <>
        {"[\n"}
        {v.map((x, i) => (
          <span key={i}>
            {inner}
            {render(x, depth + 1)}
            {i < v.length - 1 ? ",\n" : "\n"}
          </span>
        ))}
        {pad}]
      </>
    );
  }
  const entries = Object.entries(v);
  if (!entries.length) return "{}";
  return (
    <>
      {"{\n"}
      {entries.map(([k, x], i) => (
        <span key={k}>
          {inner}
          <span className="j-key">{JSON.stringify(k)}</span>: {render(x, depth + 1)}
          {i < entries.length - 1 ? ",\n" : "\n"}
        </span>
      ))}
      {pad}
      {"}"}
    </>
  );
}
