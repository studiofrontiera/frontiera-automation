import { Home } from "@/components/Home";
import { homeMeta } from "@/lib/meta";

export const metadata = { ...homeMeta("es"), alternates: { canonical: "https://www.frontiera.cl/automatizacion" } };

export default function Page() {
  return <Home lang="es" />;
}
