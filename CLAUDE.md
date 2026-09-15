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

## Workflow

Follow `ProjectInst.md` §43 (Inspect → Understand → Plan → Implement → Run checks → Review →
Fix → Report) and the decision protocol in §5 (proceed autonomously on reversible/implementation
detail; pause and discuss when a choice materially changes UX, research methodology, evidence
behavior, cost, or scope).

## Tech Stack

Next.js App Router, TypeScript, Tailwind, shadcn/ui, Zod, Tavily Research API, OpenAI Responses
API, localStorage, Vercel. Full rationale and constraints: `PRD.md` §44, `ProjectInst.md` §7–10.

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

`TAVILY_API_KEY` and `OPENAI_API_KEY` are server-side only — never `NEXT_PUBLIC_*`, never
committed, never logged. Full rules: `ProjectInst.md` §11, §39; variable list: `PRD.md` §61.
Verify `.env` is in `.gitignore` before any commit.

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
retries against live Tavily/OpenAI research calls. If making the pipeline actually work requires
repeatedly re-running real research against those APIs, check with the user before burning
credits on repeated attempts (mock data is fine for UI iteration — see `ProjectInst.md` §41).

## Reference

The repo is public; this file is the only doc committed to git. `PRD.md`, `ProjectInst.md`,
`SHIYAA-LOG.md`, and `context.md` are all gitignored — local reference material only, not part
of the public history.

- Product/architecture spec: `PRD.md`
- Collaboration, research-quality, and coding rules: `ProjectInst.md`
- Shiyaa's override decision log: `SHIYAA-LOG.md`
- Session continuity: `context.md`
