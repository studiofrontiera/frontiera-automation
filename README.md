# FRONTIERA automation studio site

Source of [frontiera.cl](https://www.frontiera.cl): a minimal, bilingual (ES/EN) website for an AI automation and integrations studio in Santiago, Chile.

The site is also a working sample of the kind of systems it sells: the home page has a **workflow playground** where visitors run real automations in the browser and inspect every step.

## The playground

Three small workflows, each built as `trigger → AI step → rule → action`:

| Scenario | AI extracts | The rule decides (in code, not by the model) | Action payload |
|---|---|---|---|
| Inbound lead | contact, intent, urgency, tasks, draft reply | notify sales now or queue | CRM contact + deal |
| Supplier invoice | supplier, tax ID, number, dates, amounts, items | net + tax = total, items add up, approval above a limit | ledger row + approval request |
| Support ticket | customer, order, category, priority, sentiment, reply | team, SLA hours, escalation | help desk ticket |

Visitors can edit the input, run it, click any node to see its data as a readable view or raw JSON, and share a deep link (`/?s=invoice#playground`). On top of that:

| Feature | How it works |
|---|---|
| **Break it** | Each scenario has a hard case: an invoice with an inflated total, a wrong RUT check digit and a hidden instruction for the AI; an urgent lead with no contact data; a furious ticket with no order number that demands a refund. The rules catch every one (unit tested). |
| **Tunable rules** | Sliders for the approval limit, SLAs and reply times. The rule and action nodes re-run in the browser on the same AI output, so the visitor sees the decision change without another API call. |
| **Documents** | The invoice scenario accepts a PDF or photo (3 MB). The AI transcribes it first, the workflow runs on the transcript, and grounding checks every field against that transcript. |
| **Time saved** | Manual minutes per item (an estimate, labelled as such) against the measured run time, and hours a month at a volume the visitor sets. |
| **Export to n8n** | Downloads an importable n8n workflow with the same steps: webhook, OpenAI with the strict schema, grounding, the rule node with the visitor's current settings, response. No key inside; it uses an n8n header credential. |
| **Your process** | The visitor describes any process in plain words and the AI drafts an automation as trigger, AI, rule, human approval and action steps, with data, rules, risks and discovery questions. Exportable to n8n as a skeleton, or sent to the contact form in one click. |

### How the AI is kept honest

- **Strict schema**: the OpenAI Responses API is called with each scenario's JSON schema in strict mode, and the answer is validated again on the server (`lib/playground/validate.ts`).
- **Grounding**: e-mails, phones, tax IDs, invoice numbers and amounts survive only if they literally appear in the input. Anything invented becomes `null`.
- **Decisions in code**: approvals, routing and SLAs are deterministic functions with unit tests. The model never decides them.
- **Graceful fallback**: without an API key, or if the call fails, a rule-based extractor returns the same shape and the UI labels the mode.
- **Privacy**: requests use `store: false`, nothing is persisted or logged.
- **Spend guard** (`lib/playground/budget.ts`): burst limits per IP, a daily AI quota per IP and per instance (beyond it the demo runs in rules mode), capped output tokens and input sizes. The hard ceiling is the monthly budget set in the OpenAI dashboard.

## Other parts

| Part | What it does |
|---|---|
| Savings calculator | Client-side estimate of hours and cost spent on repetitive work |
| Legacy redirects (`next.config.ts`) | Permanent redirects from the previous site's URLs, so old links never 404 |
| CI (`.github/workflows/ci.yml`) | Typecheck, lint, tests and build on every push |

## Stack

Next.js 15 (App Router), React 19, TypeScript, plain CSS, Vercel. No UI framework and no client-side tracking.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional: add OPENAI_API_KEY for the live AI mode
npm run dev
```

```bash
npm test          # unit tests
npm run typecheck
npm run build
```

Without `OPENAI_API_KEY` the playground runs in rule-based mode.

## Project structure

```
app/            routes: /, /en, /privacidad, /en/privacy, /api/playground, /api/design, sitemap, robots
components/     Home, Playground and DesignStudio (client), JsonView, Calculator (client), Privacy
lib/            copy (ES/EN text), metadata helpers
lib/playground/ scenarios, validation and grounding, AI step, n8n export, process designer, spend guard, tests
```

## Notes

Built and maintained by Artem Meleshchenko, product lead and builder at FRONTIERA SpA. Code is shared as a portfolio sample; site copy and brand assets belong to FRONTIERA SpA.
