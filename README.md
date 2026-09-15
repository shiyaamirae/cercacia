# CercaCia

An evidence-backed research workspace that investigates a company and role before you apply —
driven by your specific research questions, not a generic company summary.

## The problem

Job applicants research a company across a dozen sources — the job description, company site,
leadership pages, LinkedIn, news, employee/customer reviews, product pages, competitors, case
studies — and the result is fragmented across tabs and notes. Generic AI company summaries
don't fix this well because they optimize for breadth, not for the one decision that actually
matters: should I apply, and what should I emphasize if I do. CercaCia is for a candidate who
already has a job description and wants a structured, source-traceable answer to "what should
I know before I apply."

## Live link

Not deployed yet — local development only.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js App Router + TypeScript | Server route handlers keep provider API keys off the client without standing up a separate backend |
| UI | Tailwind CSS + shadcn/ui + Lucide icons | Fast and consistent, unopinionated enough to support an editorial "research workspace / case file" visual direction rather than a generic chatbot/dashboard look |
| Validation | Zod | Every AI-generated structured object (findings, sources) is validated before it enters app state — malformed evidence is never silently accepted |
| Research | Tavily Research API | Purpose-built multi-step research/search endpoint with progress streaming — no custom crawler needed for V1 |
| Synthesis | Gemini (primary) + Groq (fallback) — testing phase | Cost control during development; see `CLAUDE.md`'s Active AI Provider Override for the reasoning and what this reverts to at deployment |
| Persistence | localStorage | No accounts or cross-device sync needed for a single-user V1 |
| Deployment | Vercel | Native Next.js support |

## Local setup

The repo isn't scaffolded yet — these are the anticipated steps once it is:

```bash
git clone https://github.com/shiyaamirae/cercacia.git
cd cercacia
cp .env.example .env   # fill in real keys
npm install
npm run dev
```

## Architecture

```
Browser → Next.js → Server route → Tavily Research → Gemini/Groq synthesis
        → Zod validation → Investigation UI → localStorage
```

The full product spec and pipeline detail are maintained privately (not part of this repo's
git history) — ask the maintainer if you need them.

## Known limitations / what's next

- No accounts, payments, or team collaboration in V1 — a single local investigation per
  browser, by design.
- No job scraping, discovery, or auto-apply — CercaCia investigates a role you already have,
  it doesn't find one for you.
- Synthesis currently runs on Gemini/Groq instead of OpenAI, a testing-phase cost decision to
  be revisited at deployment.
- Nothing is built yet — this repo is at the planning/scaffold stage.
