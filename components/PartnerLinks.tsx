import { partners } from "@/lib/partners";
import type { Copy } from "@/lib/copy";

export function PartnerLinks({ c }: { c: Copy["play"] }) {
  const rel = partners.affiliate ? "sponsored noopener" : "noopener";
  return (
    <p className="fine partners">
      {c.platforms}{" "}
      <a href={partners.make} target="_blank" rel={rel}>{c.openMake} ↗</a>
      {" · "}
      <a href={partners.n8n} target="_blank" rel={rel}>{c.openN8n} ↗</a>
      {partners.affiliate && <span className="dim"> {c.affiliate}</span>}
    </p>
  );
}
