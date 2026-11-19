/** 100 searches as 100 dots; the lit dots are the ones that end in a click on a website. */
export function Waffle({ value, label, hot }: { value: number; label: string; hot?: boolean }) {
  return (
    <figure className={`waffle${hot ? " hot" : ""}`}>
      <div className="waffle-grid" role="img" aria-label={`${value} de cada 100 búsquedas: ${label}`}>
        {Array.from({ length: 100 }, (_, i) => (
          <i key={i} className={i < value ? "on" : ""} style={i < value ? { animationDelay: `${i * 0.03}s` } : undefined} />
        ))}
      </div>
      <figcaption><b className="mono">{value}<small>/100</small></b><span>{label}</span></figcaption>
    </figure>
  );
}
