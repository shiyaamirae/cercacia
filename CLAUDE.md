# CercaCia — Build Assistant

## Role

You are the primary AI developer for CercaCia, an evidence-backed job-application investigation
workspace. `PRD.md` and `ProjectInst.md` capture every product/technical decision already
made — read both before writing code, and don't re-litigate a decided choice without a reason.
This file covers only what those don't: session handoff, active overrides, and commands.

## Picking Up a Session

Check for `context.md` at repo root (gitignored, may not exist). If present, read it first —
it tracks real build status and findings across sessions that `git log` won't. Update it at
session end.

## Decision Log (SHIYAA-LOG.md)

When Shiyaa overrides an AI suggestion or default — UI, UX, product, architecture — draft an
entry in `SHIYAA-LOG.md` (gitignored) for confirmation. Wording must be Shiyaa's reasoning, not
a restatement of the AI's own rationale.

## Engineering Standards

`dev.md` is the portable engineering spec (structure, naming, dead code, types, error handling,
security, git, testing, DoD) — read it alongside this file. **It wins on conflict with this
file.** One repo-specific addition: open PRs from `.github/pull_request_template.md`, but don't
merge without Shiyaa's go-ahead.

## Workflow

Follow `ProjectInst.md` §43 (Inspect → Plan → Implement → Verify → Report) and the decision
protocol in §5 (act autonomously on reversible/implementation choices; pause when something
changes UX, research methodology, evidence behavior, cost, or scope).

## Tech Stack — Active Overrides

Full stack: `PRD.md` §44, `ProjectInst.md` §7–10. Three active deviations (full rationale in
`DECISIONS.md`, not repeated here):

- **Synthesis provider:** Mistral (primary) + Groq (fallback), not OpenAI, until deployment.
  `OPENAI_API_KEY` not required this phase. Tavily unchanged. Evidence-quality rules
  (fact/inference/no hallucination, `ProjectInst.md` §14–23) apply regardless of provider.
  Switched from Gemini to Mistral 2026-09-15 after Gemini's free-tier quota (20 requests/day)
  was exhausted mid-testing — see `DECISIONS.md`.
- **Motion for React:** added. Use for transitions that carry meaning (research progress,
  evidence appearing, tab/section changes, drawers) — not decoration. Don't ship default
  shadcn styling; build CercaCia's own visual language on top of its primitives.
- **React Hook Form + Zod:** added, for all forms. Share Zod schemas with the data-validation
  layer where shapes match.
- **Zustand:** added, overrides `ProjectInst.md` §35. Cross-component investigation state
  (active investigation, findings, progress, follow-up). Form-local state stays in RHF.

## Commands

```
npm run dev/build/lint/typecheck/test/format/format:check
```

husky + lint-staged run ESLint/Prettier on staged files pre-commit. CI
(`.github/workflows/ci.yml`) runs lint → typecheck → test → build on every PR/push to `main`.

## Project Structure

See `PRD.md` §62 for the `src/` layout. Don't over-engineer beyond it.

## Environment Variables

This phase: `TAVILY_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`. `OPENAI_API_KEY` not required
yet. Server-side only, never `NEXT_PUBLIC_*`. Full rules: `ProjectInst.md` §11, §39. Keep
`.env.example` (dummy values) in sync with `.env`.

## Self-Debugging Loop

Build/lint/type/runtime failure: read the actual error, fix, retest immediately without asking
permission, repeat autonomously up to ~3–4 attempts. Still failing → stop and report what was
tried and what's blocking. One summary at the end, not a turn-by-turn narration. Exception:
don't blindly retry against live Tavily/Mistral/Groq calls — check with Shiyaa before burning
credits (mock data is fine for UI iteration, `ProjectInst.md` §41).

## Reference

**Public (committed):** this file, `dev.md`, `.github/pull_request_template.md`, `README.md`,
`DECISIONS.md`, `.env.example`.

**Private (gitignored):** `PRD.md`, `ProjectInst.md`, `SHIYAA-LOG.md`, `context.md`,
`ROADMAP.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
