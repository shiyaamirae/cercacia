# dev.md — Engineering Standards

Portable engineering rules. Applies to every project regardless of stack.
Stack-specific details (framework, folder names, libraries, domain rules) live in `CLAUDE.md`.

**If `CLAUDE.md` and `dev.md` conflict, `CLAUDE.md` wins.**

---

## 0. The prime directive

No spaghetti. If a change makes the codebase harder to understand than it was before, it does not ship — even if it works.

Three questions before any code is written:

1. Where does this belong? (Which layer, which file, why there.)
2. What already exists that does this? (Reuse before writing.)
3. What breaks if this is wrong? (That's what gets tested.)

---

## 1. Repository structure

- Group by **feature**, not by file type. `features/auth/` beats `components/`, `hooks/`, `utils/` scattered across the tree.
- Shared code lives in `lib/` or `shared/` only after it is used in **two or more** places. Not before.
- One folder = one concern. If you can't name a folder in one word, it's doing too much.
- No `misc/`, `helpers/`, `stuff/`, `temp/`, `utils2/`. Name things for what they are.
- Every folder deeper than two levels needs a reason. Nesting is not organisation.

**Required at repo root:**

```
README.md
CLAUDE.md
dev.md
DECISIONS.md
.env.example
.gitignore
.eslintrc / eslint.config.js
.prettierrc
```

---

## 2. Files and functions

- **Files: 200 lines soft limit, 300 hard.** Past 300, split it. No exceptions for "it's all related."
- **Functions: 40 lines soft, 60 hard.** If it needs section comments inside, it's two functions.
- **One export per file** for components. Multiple small named exports are fine for pure utilities.
- **Max 3 levels of nesting.** Use early returns and guard clauses instead of pyramids of `if`.
- **Max 4 parameters.** Beyond that, pass an object.
- File name matches its main export. `UserCard.tsx` exports `UserCard`. Always.

---

## 3. Naming

- Descriptive over short. `filteredActiveUsers` beats `fau` beats `data2`.
- Booleans read as questions: `isLoading`, `hasAccess`, `shouldRetry`.
- Functions start with a verb: `fetchUser`, `parseResponse`, `validateEmail`.
- No abbreviations except universally known ones (`id`, `url`, `api`, `db`).
- Never `data`, `item`, `temp`, `result`, `handleClick2`, `newFunction`.
- Same concept = same word everywhere. Not `user` in one file and `account` in another for the same thing.

---

## 4. Dead code policy — zero tolerance

Delete, don't comment out. Git remembers everything; the repo doesn't need to.

Not allowed in a commit:

- Commented-out blocks of code
- `console.log` left over from debugging (a deliberate, structured logger is fine)
- Unused imports, variables, files, dependencies
- `TODO` without a name and a date: `// TODO(shiyaa, 2026-09-10): handle rate limit`
- Placeholder files that "might be needed later"
- Two implementations of the same thing where one is "the old one"

---

## 5. Types and data

- TypeScript **strict mode on**. Always.
- `any` is banned. Use `unknown` and narrow it. If `any` is truly unavoidable, it needs a one-line comment explaining why.
- No non-null assertions (`!`) to silence the compiler. Handle the null case.
- Types are defined once, near the thing they describe, and imported. Never redefine the same shape in two files.
- Validate anything crossing a boundary (API response, form input, env vars, URL params) at the edge, then trust it inside.
- Env vars are read in exactly one config file and exported typed. Never `process.env.X` scattered through the codebase.

---

## 6. Error handling

- Every async call has a failure path. No unhandled promises.
- Errors carry context: what was being attempted, with what input. `"Failed to fetch user"` is useless; `"Failed to fetch user ${id}: ${status}"` is not.
- Never swallow an error silently. Empty `catch {}` is a bug.
- Every async UI has three visible states: **loading, error, empty.** Success is the fourth, not the only one.
- Never surface a raw stack trace or internal error message to a user.

---

## 7. Security

- `.env` is gitignored. `.env.example` is committed with keys and dummy values, no real secrets.
- Zero secrets, API keys, tokens, or credentials in source — including in comments, tests, fixtures, and commit history.
- API keys never touch client-side code. Route calls through a server function or API route.
- Never log secrets, tokens, or full request bodies containing user data.
- Validate and sanitise all user input server-side, even if it's already validated client-side.
- Before every push, scan the diff for anything that looks like a key.

---

## 8. Git

**Branches**

- `main` is always deployable. Never commit directly to it, even solo.
- One branch per unit of work: `feat/expert-tracker-filters`, `fix/date-parsing`, `refactor/api-client`.
- Branch lives for hours or days, not weeks.

**Commits**

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `style:`, `perf:`.
- Present tense, imperative: `feat: add retry logic to digest fetcher`.
- **One logical change per commit.** A commit that touches auth, styling, and the README is three commits.
- Every commit compiles and passes lint. No "will fix in next commit."
- Banned messages: `update`, `fix`, `wip`, `asdf`, `final`, `final v2`, `changes`.

**Pull requests**

- Every change goes through a PR, even solo. The PR description is free case-study material later.
- PR body answers: what changed, why, how it was verified, what was intentionally left out.
- PRs stay small. A 2000-line PR gets reviewed by nobody, including you.
- Squash-merge to keep `main` history readable.

---

## 9. Testing

Coverage percentage is not the goal. Confidence is.

**Must be tested:**

- Core business logic and anything with branching rules
- Data transformations and parsers
- Anything involving money, dates, timezones, or auth
- Every bug that gets fixed (write the failing test first)

**Not worth testing:**

- Static presentational components
- Third-party library behaviour
- Trivial getters and pass-through wrappers

**Rules:**

- Test names describe behaviour: `returns empty array when no articles match the topic filter`.
- One assertion concept per test.
- Tests are deterministic. No reliance on real network, real time, or test execution order.
- A failing test is fixed, never skipped or deleted to get green.

---

## 10. Automation and CI

- ESLint + Prettier configured and committed. Formatting is never a manual decision or a review comment.
- Pre-commit hook (husky + lint-staged): lint and format staged files.
- GitHub Actions on every PR and every push to `main`: **install → lint → typecheck → test → build.**
- Red CI does not get merged. Ever.
- Deploys are automatic from `main`. No manual drag-and-drop deployment.

---

## 11. Documentation

**README.md** — written for someone who has never seen the project:

1. What it does, in one sentence
2. The problem it solves and who for
3. Live link + a screenshot or GIF
4. Tech stack with a one-line reason for each key choice
5. Local setup: clone → env vars → install → run
6. Architecture overview: how the pieces connect
7. Known limitations and what's next

**DECISIONS.md** — an append-only log of every non-obvious choice:

```md
## 2026-09-06 — Local Ollama instead of a hosted API

**Context:** Needed inference for the memory hub.
**Options:** OpenAI API / Claude API / local Ollama.
**Chose:** Ollama.
**Why:** Zero per-request cost, data stays local, latency acceptable for this use case.
**Tradeoff:** Requires local setup to run; no mobile support.
```

This file is the single highest-signal thing in the repo. It's the difference between "built a thing" and "made engineering decisions."

**Code comments** explain _why_, never _what_. If a comment explains what the code does, rewrite the code instead.

---

## 12. Working with Claude Code

**Before writing anything**

- `CLAUDE.md` exists and is current. Read it and this file at the start of every session.
- Non-trivial work goes through **plan mode**. Show the plan, get approval, then write.
- The plan names the files it will touch and why. If a file isn't in the plan, don't touch it.

**While building**

- One scoped task per prompt. "Add the login form component, no auth logic yet" — not "build authentication."
- Commit after each logical unit, not in one dump at the end.
- Match the patterns already in the codebase. Never introduce a second way of doing something that already has a way.
- Never add a dependency without saying so and giving a reason.
- Never refactor unrelated code inside a feature commit. Note it, do it separately.
- Never generate placeholder or mock data in production paths.

**Before every commit — Definition of Done**

- [ ] Types pass strict, no new `any`
- [ ] Lint and format clean
- [ ] Tests pass, and new logic has tests
- [ ] Build succeeds
- [ ] No `console.log`, dead code, or commented-out blocks
- [ ] No secrets in the diff
- [ ] Loading, error, and empty states handled
- [ ] Every touched file is under the line limits
- [ ] `DECISIONS.md` updated if a non-obvious choice was made
- [ ] **I can explain every line of this diff out loud**

That last one is the real gate. Code you can't explain in an interview doesn't belong in your repo.

---

## 13. Refactor triggers

Stop and refactor when any of these become true:

- The same logic appears a third time (twice is fine, three times is a pattern)
- A file crosses 300 lines
- A function needs a comment to explain its middle section
- You scroll to understand one function
- A change in one place breaks something unrelated
- You can't name a file or function without using "and"
- You hesitate before touching a file because you're not sure what it does

Refactors are their own branch, their own PR, `refactor:` prefix, no behaviour change.
