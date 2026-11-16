import type { Lang } from "./playground/types";

/**
 * All page copy, ES and EN. Rules: no invented clients, results or certifications; no
 * long dashes; the person behind the studio is never called CEO, founder or owner.
 */

export const WHATSAPP = {
  es: "https://wa.me/56942022131?text=Hola%20FRONTIERA%2C%20quiero%20automatizar%20un%20proceso.",
  en: "https://wa.me/56942022131?text=Hi%20FRONTIERA%2C%20I%20would%20like%20to%20automate%20a%20process.",
};

/** FormSubmit endpoint; first submission to a new address asks the owner to confirm it. */
export const FORM_ACTION = "https://formsubmit.co/studio@frontiera.cl";

export const COPY = {
  es: {
    meta: {
      title: "FRONTIERA | Automatización con IA para empresas",
      description:
        "Automatizamos procesos con Make, Zapier y n8n, conectamos IA y APIs a sus sistemas y construimos dashboards que se actualizan solos. Santiago de Chile. Pruebe el playground en vivo.",
    },
    tag: "automation studio",
    nav: { demo: "Playground", services: "Servicios", process: "Proceso", contact: "Contacto" },
    hero: {
      kicker: "Make · Zapier · n8n · IA · APIs",
      title: ["Su equipo deja de copiar y pegar.", "Los procesos corren solos."],
      lead: "Diseñamos e implementamos automatizaciones con IA para pymes y equipos: desde el correo que llega hasta el CRM, la planilla y el reporte. Sin cambiar las herramientas que ya usa.",
      cta: "Abrir el playground",
      cta2: "Hablar de mi proceso",
    },
    term: [
      ["09:14:02", "webhook", "nuevo correo recibido"],
      ["09:14:03", "ai", "intención: cotización · urgencia: alta"],
      ["09:14:03", "crm", "contacto creado · negocio abierto"],
      ["09:14:04", "sheets", "fila agregada al pipeline"],
      ["09:14:04", "slack", "aviso enviado a ventas"],
      ["09:14:05", "done", "5 pasos · 3,1 s · 0 clics"],
    ],
    play: {
      label: "playground",
      title: "Pruebe una automatización real, aquí mismo.",
      lead: "Elija un caso, edite el texto y ejecute el flujo. Verá cada paso: qué entra, qué extrae la IA, qué decide la regla y qué se enviaría a sus sistemas.",
      input: "Entrada",
      run: "Ejecutar flujo",
      running: "Ejecutando…",
      reset: "Restaurar ejemplo",
      share: "Copiar enlace",
      copied: "Enlace copiado",
      view: "Vista",
      json: "JSON",
      nodeHint: "Toque un paso para ver sus datos.",
      decision: "Decisión",
      checks: "Validaciones",
      payload: "Payload enviado",
      waiting: "Ejecute el flujo para ver el resultado.",
      modeAi: "IA en vivo",
      modeRules: "modo reglas (IA no disponible)",
      privacy: "El texto se procesa solo para esta demo y no se guarda. No pegue datos reales sensibles.",
      kinds: { trigger: "disparador", ai: "IA", rule: "regla", action: "acción" },
      errors: { rate_limited: "Demasiadas ejecuciones seguidas. Espere un minuto.", length: "Escriba entre 10 y 2000 caracteres.", generic: "No se pudo ejecutar. Intente de nuevo." },
    },
    calc: {
      label: "calculadora",
      title: "¿Cuánto tiempo se va en tareas repetitivas?",
      people: "Personas que hacen la tarea",
      hours: "Horas por persona a la semana",
      cost: "Costo por hora (CLP)",
      share: "Parte automatizable",
      perMonth: "horas al mes",
      money: "CLP al mes",
      note: "Estimación simple para orientar la conversación. El ahorro real se mide en el diagnóstico, con su proceso.",
    },
    servicesTitle: "Qué automatizamos",
    services: [
      {
        k: "01",
        title: "Flujos automáticos",
        body: "Make, Zapier o n8n conectando formularios, correo, CRM, planillas y mensajería.",
        list: ["Leads directo al CRM", "Órdenes y facturas a planillas", "Avisos por Slack, correo o WhatsApp"],
      },
      {
        k: "02",
        title: "IA en sus procesos",
        body: "Modelos como OpenAI y Claude que leen, clasifican y redactan, con revisión humana donde importa.",
        list: ["Clasificar y responder correos", "Extraer datos de PDF y documentos", "Asistentes sobre sus propios documentos"],
      },
      {
        k: "03",
        title: "Integraciones API",
        body: "Hacemos que sus sistemas conversen cuando no hay un conector listo.",
        list: ["Webhooks y sincronización", "APIs públicas y privadas", "Migraciones de datos"],
      },
      {
        k: "04",
        title: "Datos y dashboards",
        body: "Python, Power BI, Looker Studio y Sheets con indicadores que se actualizan solos.",
        list: ["Consolidar fuentes dispersas", "Reportes automáticos", "Paneles para gerencia"],
      },
    ],
    processTitle: "Cómo trabajamos",
    process: [
      ["Diagnóstico", "30 minutos. Mapeamos el proceso, quién lo hace y cuánto tiempo toma."],
      ["Propuesta", "Alcance escrito, plazo y precio cerrado antes de empezar."],
      ["Construcción", "Entregas cortas y pruebas con sus datos antes de encender nada."],
      ["Entrega", "Documentación, cuentas a su nombre y soporte para ajustes."],
    ],
    rules: [
      "Sus datos y cuentas quedan a su nombre.",
      "La IA propone; una persona aprueba lo sensible.",
      "Si no conviene automatizar, se lo decimos.",
    ],
    stackTitle: "Stack",
    contact: {
      title: "Cuéntenos qué proceso le quita tiempo.",
      lead: "Unas líneas bastan. Respondemos con preguntas concretas o una primera idea de solución.",
      name: "Nombre",
      email: "Correo",
      company: "Empresa (opcional)",
      tools: "Herramientas que usan hoy",
      toolsHint: "Excel, HubSpot, Shopify, Gmail…",
      message: "¿Qué proceso quiere automatizar?",
      send: "Enviar",
      whatsapp: "o escríbanos por WhatsApp",
      subject: "Nuevo lead web: Automatización",
    },
    foot: { line: "FRONTIERA SpA · Santiago de Chile", privacy: "Privacidad" },
  },
  en: {
    meta: {
      title: "FRONTIERA | AI automation for businesses",
      description:
        "We automate processes with Make, Zapier and n8n, connect AI and APIs to your systems and build dashboards that update themselves. Based in Santiago, Chile. Try the live playground.",
    },
    tag: "automation studio",
    nav: { demo: "Playground", services: "Services", process: "Process", contact: "Contact" },
    hero: {
      kicker: "Make · Zapier · n8n · AI · APIs",
      title: ["Your team stops copy-pasting.", "Processes run themselves."],
      lead: "We design and build AI automations for small businesses and teams: from the e-mail that arrives to the CRM, the spreadsheet and the report. Without changing the tools you already use.",
      cta: "Open the playground",
      cta2: "Talk about my process",
    },
    term: [
      ["09:14:02", "webhook", "new e-mail received"],
      ["09:14:03", "ai", "intent: quote · urgency: high"],
      ["09:14:03", "crm", "contact created · deal opened"],
      ["09:14:04", "sheets", "row added to pipeline"],
      ["09:14:04", "slack", "sales notified"],
      ["09:14:05", "done", "5 steps · 3.1 s · 0 clicks"],
    ],
    play: {
      label: "playground",
      title: "Try a real automation, right here.",
      lead: "Pick a case, edit the text and run the workflow. You will see every step: what comes in, what the AI extracts, what the rule decides and what would be sent to your systems.",
      input: "Input",
      run: "Run workflow",
      running: "Running…",
      reset: "Restore sample",
      share: "Copy link",
      copied: "Link copied",
      view: "View",
      json: "JSON",
      nodeHint: "Tap a step to inspect its data.",
      decision: "Decision",
      checks: "Checks",
      payload: "Payload sent",
      waiting: "Run the workflow to see the result.",
      modeAi: "live AI",
      modeRules: "rules mode (AI unavailable)",
      privacy: "The text is processed only for this demo and is not stored. Do not paste sensitive real data.",
      kinds: { trigger: "trigger", ai: "AI", rule: "rule", action: "action" },
      errors: { rate_limited: "Too many runs in a row. Wait a minute.", length: "Write between 10 and 2000 characters.", generic: "Could not run. Try again." },
    },
    calc: {
      label: "calculator",
      title: "How much time goes into repetitive tasks?",
      people: "People doing the task",
      hours: "Hours per person per week",
      cost: "Cost per hour (USD)",
      share: "Automatable share",
      perMonth: "hours per month",
      money: "USD per month",
      note: "A simple estimate to frame the conversation. Real savings are measured in discovery, on your process.",
    },
    servicesTitle: "What we automate",
    services: [
      {
        k: "01",
        title: "Automated workflows",
        body: "Make, Zapier or n8n connecting forms, e-mail, CRM, spreadsheets and messaging.",
        list: ["Leads straight into the CRM", "Orders and invoices into sheets", "Alerts via Slack, e-mail or WhatsApp"],
      },
      {
        k: "02",
        title: "AI in your processes",
        body: "Models like OpenAI and Claude that read, classify and draft, with human review where it matters.",
        list: ["Sort and reply to e-mail", "Extract data from PDFs and documents", "Assistants over your own documents"],
      },
      {
        k: "03",
        title: "API integrations",
        body: "We get your systems talking when there is no ready-made connector.",
        list: ["Webhooks and sync", "Public and private APIs", "Data migrations"],
      },
      {
        k: "04",
        title: "Data and dashboards",
        body: "Python, Power BI, Looker Studio and Sheets with numbers that update themselves.",
        list: ["Merge scattered sources", "Automated reports", "Management dashboards"],
      },
    ],
    processTitle: "How we work",
    process: [
      ["Discovery", "30 minutes. We map the process, who does it and how long it takes."],
      ["Proposal", "Written scope, timeline and a fixed price before we start."],
      ["Build", "Short iterations, tested on your data before anything goes live."],
      ["Handover", "Documentation, accounts in your name and support for adjustments."],
    ],
    rules: [
      "Your data and accounts stay in your name.",
      "AI suggests; a person approves what is sensitive.",
      "If automating is not worth it, we tell you.",
    ],
    stackTitle: "Stack",
    contact: {
      title: "Tell us which process eats your time.",
      lead: "A few lines are enough. We reply with specific questions or a first idea for a solution.",
      name: "Name",
      email: "E-mail",
      company: "Company (optional)",
      tools: "Tools you use today",
      toolsHint: "Excel, HubSpot, Shopify, Gmail…",
      message: "Which process do you want to automate?",
      send: "Send",
      whatsapp: "or message us on WhatsApp",
      subject: "New website lead: Automation",
    },
    foot: { line: "FRONTIERA SpA · Santiago, Chile", privacy: "Privacy" },
  },
} satisfies Record<Lang, unknown>;

export const STACK = ["Make", "Zapier", "n8n", "OpenAI", "Claude", "Python", "Power BI", "Looker Studio", "Google Workspace", "HubSpot", "Notion", "Supabase", "Next.js", "Vercel"];

export type Copy = (typeof COPY)["es"];
