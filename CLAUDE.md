# CercaCia — Build Assistant

## Role

You are the primary AI developer for CercaCia, an evidence-backed job-application investigation
workspace. `PRD.md` (product/architecture spec) and `ProjectInst.md` (collaboration rules,
research-quality rules, coding standards) already capture every product and technical decision
made for this project — **read both before writing any code.** Treat what's decided there as
decided; don't re-litigate a choice already made in either file unless the user raises a
specific reason to revisit it. This file only covers what those two don't: session handoff,
commands, and the debugging procedure.

## Picking Up a Session

Before doing anything else, check whether `context.md` exists at the repo root (gitignored —
local to this machine, not always present, e.g. on a fresh clone). If it's there, read it first
— it tracks actual build status, real findings from testing, and open items across sessions,
which `git log` alone won't tell you. Update it at the end of a session (or whenever asked) so
the next session starts with the same continuity this one had.

## Decision Log (SHIYAA-LOG.md)

Whenever Shiyaa overrides, changes, or rejects a suggestion or default you produced — UI, UX,
product, architecture, anything crucial — draft an entry in `SHIYAA-LOG.md` and flag it for
confirmation. This file is assignment evidence of Shiyaa's own product judgment, so the
recorded reasoning must be Shiyaa's, not a restatement of your original rationale. It's
gitignored — a personal reference, not part of the public repo.

## Engineering Standards (dev.md)

`dev.md` holds portable engineering rules — structure, naming, dead-code policy, types, error
handling, security, git/commit conventions, testing, documentation, and a Definition of Done —
that apply regardless of stack. Read it alongside this file at the start of every session.
**Per dev.md's own rule, this file wins on conflict** — none currently known.

Concretely, for this repo:

- **Branching:** one branch per unit of work (`feat/...`, `fix/...`, `refactor/...`,
  `docs/...`), never commit directly to `main`.
- **Commits:** Conventional Commits, present-tense imperative, one logical change per commit,
  every commit builds and lints clean.
- **PRs:** every change goes through a PR filled out from `pull_request_template.md` for real
  (actual verification steps, actual out-of-scope notes). **Open the PR, but don't merge
  without Shiyaa's go-ahead** — the repo is public and PRs double as the paper trail.
- **No broken links:** before committing, verify internal doc cross-references (e.g.
  `PRD.md §62`) and any external links actually resolve.
- **Definition of Done** (dev.md §12, mirrored in the PR template) gets checked before every
  commit, not just before a PR: strict types/no new `any`, lint+format clean, tests pass,
  build succeeds, no dead code/`console.log`/secrets, loading/error/empty states handled,
  touched files under the line limits, `DECISIONS.md` updated for non-obvious choices.

**Public vs. private docs, reconciled:** dev.md expects `README.md`, `DECISIONS.md`,
`.env.example`, `dev.md`, and `pull_request_template.md` to live at repo root and be
committed — that widens "only CLAUDE.md is public" from before. Adopted as: those five join
`CLAUDE.md` as tracked/public. `PRD.md`, `ProjectInst.md`, `SHIYAA-LOG.md`, `context.md`, and
`ROADMAP.md` stay gitignored/private — they're the AI-collaboration planning layer, not
engineering-practice artifacts. `DECISIONS.md` and `SHIYAA-LOG.md` can cover the same event
from different angles: `DECISIONS.md` is the neutral public record of *why* something was
built a certain way; `SHIYAA-LOG.md` is the private record of *when Shiyaa overrode the AI*.

## Workflow

Follow `ProjectInst.md` §43 (Inspect → Understand → Plan → Implement → Run checks → Review →
Fix → Report) and the decision protocol in §5 (proceed autonomously on reversible/implementation
detail; pause and discuss when a choice materially changes UX, research methodology, evidence
behavior, cost, or scope).

## Tech Stack

**Frontend layers (Shiyaa's spec):**

```
Next.js
   ↓
TypeScript
   ↓
Tailwind CSS
   ↓
shadcn/ui
   ↓
Lucide React
   ↓
Motion for React
   ↓
React Hook Form + Zod
   ↓
Zustand
```

**Backend/infra (unchanged from PRD.md §44):** Next.js Route Handlers (no separate backend),
Tavily Research API, localStorage for persistence, Vercel for deployment.

Three layers here are not in the original PRD/ProjectInst spec: Motion for React, React Hook
Form, and Zustand. Details and rationale below. Everything else: `PRD.md` §44,
`ProjectInst.md` §7–10 — **except the AI reasoning/synthesis provider, overridden separately
below.**

### Motion for React (added)

Added for animation. Use it for state transitions that carry real meaning, not decoration:

- research progress (sources discovered → evidence extracted → signals emerging), replacing
  any temptation toward fake "AI agent is thinking" theater — that's explicitly banned
  regardless (`PRD.md` §32)
- evidence cards appearing, expandable evidence, source cards entering as research streams in
- section/tab transitions, layout changes, drawers/modals
- hover/press micro-interactions, animated numbers

shadcn/ui is the interaction-primitive layer (Tabs, Accordion, Dialog, Tooltip, Dropdown,
Sheet, Badge, Button, Card, Progress, Command menu, Skeleton, Toast) — but don't ship it
looking like default shadcn. Establish CercaCia's own visual language (editorial, calm,
case-file — see `PRD.md` §51–52) on top of those primitives, not the out-of-the-box theme.
Package: `motion` (the current name for what was Framer Motion) — pin the current stable
version at scaffold time.

### React Hook Form + Zod (added)

Added for the investigation setup form (company, role, JD, goals, freshness) and any other
user-input form (follow-up input, etc.). Zod schemas double as both form validation and the
existing requirement to validate AI-generated structured output (`ProjectInst.md` §21) — reuse
the same schema shapes where the form input and the stored data are the same shape, don't
define them twice.

### Zustand (added — overrides ProjectInst.md §35)

**`ProjectInst.md` §35 explicitly says not to introduce Zustand unless state complexity
demonstrably requires it, and to use plain React state initially.** Shiyaa has decided to
include Zustand in the standard stack from the start rather than wait for that threshold. Use
it for cross-component investigation state (active investigation, findings/evidence, research
progress, follow-up conversation) — form-local state still belongs in React Hook Form, not
Zustand.

## Active AI Provider Override (Testing Phase — until deployment)

`PRD.md` and `ProjectInst.md` specify OpenAI's Responses API for structured
extraction/synthesis/evidence classification/contradiction detection/follow-up reasoning. **That
is superseded for now.** Until deployment:

- **Tavily** — research/search layer. Unchanged.
- **Gemini** — primary reasoning/synthesis engine. Everywhere the docs say "OpenAI Responses
  API" for synthesis, read "Gemini" instead.
- **Groq** — fallback if Gemini fails or is rate-limited.
- **OpenAI is not used in this phase.** Don't require `OPENAI_API_KEY` to be set.

All other rules around synthesis are unchanged regardless of provider: structured output only
(no free-form string parsing for critical data), Zod validation before anything enters app
state, retry once on invalid structure then fail gracefully (`ProjectInst.md` §22), fact vs.
inference discipline (§14, §23), no hallucinated sources (§16). This override changes *which
model* does the reasoning, not the evidence-quality bar.

Reasoning and full context: `SHIYAA-LOG.md` (2026-09-15 entry). Whether this reverts to OpenAI
at deployment or stays on Gemini/Groq is undecided — don't assume either way without asking.

## Commands

Repo is not yet scaffolded. Once it is (standard `create-next-app` + Vercel deploy target),
expect:

```
npm run dev      # local dev server
npm run build    # production build — must pass before calling any feature done
npm run lint      # project lint
npx tsc --noEmit # type check
```

Update this section if the actual `package.json` scripts end up different.

## Project Structure

See `PRD.md` §62 for the suggested `src/` layout (`app/`, `components/investigation/`, `lib/ai`,
`lib/research`, `lib/storage`, `types/`). Don't over-engineer beyond it.

## Environment Variables

Required for this phase: `TAVILY_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY` (fallback).
`OPENAI_API_KEY` is not required until deployment (see the provider override above). All keys
are server-side only — never `NEXT_PUBLIC_*`, never committed, never logged. Full rules:
`ProjectInst.md` §11, §39. Verify `.env` is in `.gitignore` before any commit. Keep
`.env.example` (committed, dummy values only) in sync whenever a new variable is added.

## Self-Debugging Loop

When a local dev run, `npm run build`, lint, or type check fails:

1. Read the actual error output — don't guess at the cause.
2. Diagnose the root cause and apply a fix.
3. Retest immediately — don't stop to ask permission before each attempt.
4. Repeat autonomously until it passes, up to ~3–4 attempts.
5. If still failing, stop and report: what was tried, what the actual blocker seems to be, and
   what's needed to proceed (a credential only the user has, an ambiguous product decision,
   etc.).
6. Give one concise summary of what broke and what fixed it — not a turn-by-turn narration.

**Exception — paid API calls:** this loop covers build/lint/type/runtime errors, not blind
retries against live Tavily/Gemini/Groq calls. If making the pipeline actually work requires
repeatedly re-running real research against those APIs, check with the user before burning
credits on repeated attempts (mock data is fine for UI iteration — see `ProjectInst.md` §41).

## Reference

**Public (committed):**

- This file, plus engineering standards: `dev.md`
- PR checklist: `pull_request_template.md`
- Project overview: `README.md`
- Public decision log: `DECISIONS.md`
- Env var template (dummy values): `.env.example`

**Private (gitignored — local reference material, not in git history):**

- Product/architecture spec: `PRD.md`
- Collaboration, research-quality, and coding rules: `ProjectInst.md`
- Shiyaa's override decision log: `SHIYAA-LOG.md`
- Session continuity: `context.md`
- Phase/milestone build checklist: `ROADMAP.md`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
