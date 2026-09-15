# CercaCia

![status](https://img.shields.io/badge/status-in%20development-orange)
![CI](https://github.com/shiyaamirae/cercacia/actions/workflows/ci.yml/badge.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![license](https://img.shields.io/badge/license-all%20rights%20reserved-lightgrey)

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

| Layer       | Choice                                                  | Why                                                                                                                                                  |
| ----------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework   | Next.js 16 (App Router) + TypeScript                    | Server route handlers keep provider API keys off the client without standing up a separate backend                                                   |
| UI          | Tailwind CSS v4 + shadcn/ui (Radix primitives) + Lucide | Fast, consistent primitives — built into an editorial "research workspace / case file" visual language rather than shipped as default shadcn         |
| Motion      | Motion for React                                        | Transitions that carry meaning (research progress, evidence appearing, section changes) — not decoration                                             |
| Forms       | React Hook Form + Zod                                   | One shared validation layer between the setup form and the data model                                                                                |
| State       | Zustand                                                 | Cross-component investigation state (setup, progress, results) — form-local state stays in RHF                                                       |
| Validation  | Zod                                                     | Every AI-generated structured object (findings, sources) is Zod-validated before it enters app state — malformed evidence is never silently accepted |
| Research    | Tavily Research API                                     | Purpose-built multi-step research/search endpoint with real progress streaming — no custom crawler                                                   |
| Synthesis   | Mistral (primary) + Groq (fallback) — testing phase     | Cost control during development; see `CLAUDE.md`'s "Tech Stack — Active Overrides" for the reasoning and what this reverts to at deployment          |
| Persistence | localStorage                                            | No accounts or cross-device sync needed for a single-user V1                                                                                         |
| Deployment  | Vercel (planned)                                        | Native Next.js support                                                                                                                               |

## Local setup

```bash
git clone https://github.com/shiyaamirae/cercacia.git
cd cercacia
npm install
cp .env.example .env   # fill in TAVILY_API_KEY, MISTRAL_API_KEY, GROQ_API_KEY
npm run dev
```

Then open `http://localhost:3000`. `npm run lint / typecheck / test / build` run the same
checks CI does.

## Architecture

```
Browser
  → Next.js App Router  (/, /investigate, /investigate/progress)
  → POST /api/investigate  (Next.js Route Handler)
      → Tavily Research — one task per selected investigation goal, streamed
      → Mistral synthesis (Groq fallback) — structured, Zod-validated findings
  ← newline-delimited progress + result events, streamed back
  → localStorage  (setup, results, follow-up — persisted client-side)
```

The research pipeline streams real progress to the browser over a single held-open request
rather than faking activity — see `DECISIONS.md` for why that's a held-open POST rather than a
more typical create-task-then-poll SSE design. Every finding cites its sources by an id
constrained to what Tavily actually returned, never a URL the model wrote itself.

The full product spec and pipeline detail are maintained privately (not part of this repo's
git history) — ask the maintainer if you need them.

## Known limitations / what's next

- Built so far: the landing page, the investigation setup screen (company/role/JD, goal
  selection, freshness, live summary), and the server-side research pipeline
  (`POST /api/investigate` — Tavily + Mistral/Groq, evidence classification, fact vs. inference).
- Not yet wired together: the setup screen doesn't call the pipeline yet — `/investigate/progress`
  is still a placeholder. That, plus the results dashboard, is next.
- No accounts, payments, or team collaboration in V1 — a single local investigation per
  browser, by design.
- No job scraping, discovery, or auto-apply — CercaCia investigates a role you already have,
  it doesn't find one for you.

## Contributing

Solo project, not currently accepting outside contributions. Engineering standards for anyone
working in this repo (including AI agents) are in `dev.md` and `CLAUDE.md`.

## License

All rights reserved. This repository is shared publicly for portfolio and reference purposes
only — no license is granted to use, copy, modify, or distribute this code.
