import Link from "next/link";
import type { Lang } from "@/lib/playground/types";

const TEXT = {
  es: {
    title: "Política de privacidad",
    back: "← Volver",
    body: [
      ["Responsable", "FRONTIERA SpA, Santiago de Chile. Consultas sobre datos personales: por el formulario de contacto o WhatsApp indicados en el sitio."],
      ["Formulario de contacto", "Usamos el nombre, correo, empresa y mensaje que usted envía solo para responder su consulta y preparar una propuesta. El formulario se entrega mediante el servicio FormSubmit. No vendemos ni cedemos estos datos."],
      ["Playground", "El texto, los documentos (PDF o fotos) y las descripciones de procesos que use en el playground se envían a un proveedor de IA (OpenAI) solo para generar la respuesta que ve en pantalla. No los guardamos ni los usamos para otra finalidad. No pegue datos personales reales o sensibles."],
      ["Conservación", "Conservamos los mensajes del formulario mientras exista una conversación comercial y luego los eliminamos a solicitud."],
      ["Sus derechos", "Puede pedir acceso, rectificación o eliminación de sus datos escribiéndonos por los canales de contacto, conforme a la Ley 19.628 de Chile."],
      ["Cookies", "Este sitio no usa cookies de publicidad ni de seguimiento."],
    ],
  },
  en: {
    title: "Privacy policy",
    back: "← Back",
    body: [
      ["Controller", "FRONTIERA SpA, Santiago, Chile. Questions about personal data: through the contact form or WhatsApp shown on the site."],
      ["Contact form", "We use the name, e-mail, company and message you send only to answer your enquiry and prepare a proposal. The form is delivered through the FormSubmit service. We do not sell or share this data."],
      ["Playground", "Text, documents (PDFs or photos) and process descriptions you use in the playground are sent to an AI provider (OpenAI) only to generate the answer you see on screen. We do not store them or use them for anything else. Do not paste real personal or sensitive data."],
      ["Retention", "We keep form messages while a business conversation exists and delete them on request."],
      ["Your rights", "You can ask for access, correction or deletion of your data through the contact channels, under Chilean Law 19.628."],
      ["Cookies", "This site uses no advertising or tracking cookies."],
    ],
  },
};

export function Privacy({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <main className="wrap legal">
      <Link className="mono dim" href={lang === "es" ? "/" : "/en"}>{t.back}</Link>
      <h1>{t.title}</h1>
      {t.body.map(([h, p]) => (
        <section key={h}>
          <h2>{h}</h2>
          <p>{p}</p>
        </section>
      ))}
    </main>
  );
}
