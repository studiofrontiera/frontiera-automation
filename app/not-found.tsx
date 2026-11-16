import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap legal">
      <p className="mono accent">404</p>
      <h1>Página no encontrada</h1>
      <Link className="btn" href="/">Ir al inicio →</Link>
    </main>
  );
}
