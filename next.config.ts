import type { NextConfig } from "next";

/**
 * Paths of the previous frontiera.cl (a real-estate site) that may still be linked or
 * indexed. They all land on the home page with a permanent redirect instead of a 404.
 */
const LEGACY_PATHS = [
  "/inmobiliario", "/propietarios", "/buscar", "/propiedades", "/propiedades/:path*",
  "/oportunidades", "/herramientas", "/costo-ocupacion", "/capacidad-oficina",
  "/rentabilidad-comercial", "/reajuste-arriendo", "/calculadora-hipotecaria",
  "/contribuciones", "/avaluo-fiscal", "/contacto", "/referidos", "/gracias",
  "/comparar-oficinas", "/mi-espacio", "/mi-espacio/:path*", "/terminos",
];
const LEGACY_EN = [
  "/en/real-estate", "/en/propietarios", "/en/buscar", "/en/propiedades", "/en/propiedades/:path*",
  "/en/opportunities", "/en/herramientas", "/en/costo-ocupacion", "/en/capacidad-oficina",
  "/en/rentabilidad-comercial", "/en/reajuste-arriendo", "/en/calculadora-hipotecaria",
  "/en/contribuciones", "/en/avaluo-fiscal", "/en/contacto", "/en/referrals", "/en/thank-you",
  "/en/comparar-oficinas", "/en/terminos",
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      ...LEGACY_PATHS.map((source) => ({ source, destination: "/", permanent: true })),
      ...LEGACY_EN.map((source) => ({ source, destination: "/en", permanent: true })),
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
