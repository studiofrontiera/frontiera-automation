# FRONTIERA automation studio site

Source of [frontiera.cl](https://www.frontiera.cl): a minimal, bilingual (ES/EN) website for an AI automation and integrations studio in Santiago, Chile.

The site is also a working sample of the kind of systems it sells: the home page runs a live AI workflow step that visitors can try.

## What is inside

| Part | What it does |
|---|---|
| Live AI demo (`app/api/demo`) | Turns an inbound customer e-mail into a structured CRM record, follow-up tasks and a draft reply, using the OpenAI Responses API with a strict JSON schema |
| Guardrails (`lib/demo.ts`) | Contact data is accepted only if it literally appears in the message, enums are validated, output is length-bounded, per-IP rate limit, nothing is stored |
| Rule-based fallback | If the AI call is not configured or fails, a deterministic extractor returns the same shape, and the UI labels the mode honestly |
| Savings calculator | Client-side estimate of hours and cost spent on repetitive work |
| Legacy redirects (`next.config.ts`) | Permanent redirects from the previous site's URLs, so old links never 404 |
| Tests (`lib/demo.test.ts`) | Node test runner covering extraction, intent and the sanitizer |

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

Without `OPENAI_API_KEY` the demo runs in rule-based mode.

## Project structure

```
app/            routes: /, /en, /privacidad, /en/privacy, /api/demo, sitemap, robots
components/     Home, Demo (client), Calculator (client), Privacy
lib/            copy (ES/EN text), demo logic and schema, metadata helpers
```

## Notes

Built and maintained by Artem Meleshchenko, product lead and builder at FRONTIERA SpA. Code is shared as a portfolio sample; site copy and brand assets belong to FRONTIERA SpA.
