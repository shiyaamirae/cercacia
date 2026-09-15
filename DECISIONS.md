# DECISIONS.md

Append-only log of non-obvious engineering decisions. One entry per decision, oldest first.

## 2026-09-15 — Gemini + Groq for synthesis instead of OpenAI (testing phase)

**Context:** The product spec calls for OpenAI's Responses API as the reasoning/synthesis
layer (structured extraction, evidence classification, contradiction detection, follow-up
reasoning) across the CercaCia pipeline.

**Options:** OpenAI Responses API as originally specified / Gemini / Groq / some combination.

**Chose:** Gemini as the primary synthesis engine, Groq as fallback if Gemini fails or is
rate-limited. Tavily is unchanged as the research/search layer.

**Why:** Avoid burning OpenAI credits during iterative pre-deployment development and testing.

**Tradeoff:** Two provider integrations to maintain (Gemini + Groq) instead of one. Whether to
revert to OpenAI at deployment, or stay on Gemini/Groq, is still open.

## 2026-09-15 — Motion for React added for UI animation

**Context:** The base frontend stack (Next.js, Tailwind, shadcn/ui, Lucide) has no animation
primitive. The research-in-progress experience (sources discovered → evidence extracted →
signals emerging) needs to feel alive without resorting to fake "AI agent thinking" theater.

**Options:** CSS transitions only / Motion for React / another animation library (React
Spring, GSAP).

**Chose:** Motion for React (the current name for what was Framer Motion).

**Why:** First-class React API, handles layout animations and gesture/hover/press interactions
with little code, pairs well with shadcn/ui's component model.

**Tradeoff:** One more dependency to maintain; animation needs restraint so it supports
comprehension (evidence-over-eloquence) rather than becoming decorative.

## 2026-09-15 — Zustand and React Hook Form adopted from the start

**Context:** The original plan called for plain React state, adding a state library only once
complexity demonstrably required it, to keep the two-day build simple.

**Options:** Plain React state / context (as originally planned) / Zustand from day one /
another state library (Jotai, Redux Toolkit).

**Chose:** Zustand for cross-component app state (active investigation, findings, research
progress, follow-up conversation); React Hook Form + Zod for form state/validation (setup
form, follow-up input) — sharing Zod schemas with the data-validation layer where the shapes
match.

**Why:** Decided upfront rather than waiting for complexity to force the issue.

**Tradeoff:** Two more dependencies than the minimal-first plan called for; the discipline of
"start plain, add only when justified" is traded for architectural consistency decided
up front.

## 2026-09-15 — No open-source license (all rights reserved)

**Context:** The repo is public but had no LICENSE file, which is ambiguous by default —
worth stating explicitly rather than leaving silent.

**Options:** MIT (permissive, common default for portfolio/assignment repos) / Apache 2.0 /
no LICENSE file (GitHub default: all rights reserved, viewable but not legally reusable).

**Chose:** No LICENSE file — all rights reserved, stated explicitly in `README.md`.

**Why:** CercaCia may become more than a class assignment; a permissive license would let
anyone copy, modify, or sell derivatives, which isn't desired while that's still undecided.

**Tradeoff:** Less conventional for a portfolio repo (no badge-friendly open license), and
anyone wanting to build on it legitimately would need to ask first.

## 2026-09-15 — Landing page design system via the Hallmark skill

**Context:** PRD.md §51-52 specifies an "editorial, calm, case-file" visual direction and
explicitly bans the generic-AI-chatbot / neon-dashboard / default-shadcn look. Needed a
concrete typography, color, and layout system for the actual landing page, not just a
principle to keep in mind.

**Options:** Hand-pick fonts/colors/layout ad hoc / install and follow the `hallmark` design
skill (nutlope/hallmark, MIT, built specifically to stop AI-generated UI from defaulting to
generic patterns).

**Chose:** Installed Hallmark, followed its documented process by hand (its own runtime skill
registration didn't pick up mid-session): editorial genre, Specimen macrostructure (adapted —
content is one block, no left-margin numbered column), custom warm-ochre OKLCH palette, N9
edge-aligned-minimal nav, Ft2 inline-single-line footer, C3 typographic-link CTA (no filled
button). Kept the existing Geist body font (pre-flight-preserved per Hallmark's own rule
against stomping an established stack) and added Fraunces as the display face.

**Why:** A documented, checkable process (58 anti-slop gates) beats ad hoc taste calls, and its
"editorial" genre defaults are close to word-for-word what PRD.md already specified.

**Tradeoff:** Specimen is explicitly "no longer a default" in Hallmark's own rules — reaching
for it is justified here because the brief is genuinely, explicitly editorial, but it needs to
not become the reflexive choice for every future screen (tracked in `.hallmark/log.json`,
gitignored, for diversification on the next build).

## 2026-09-15 — RHF forms wired directly, no shadcn `form` wrapper

**Context:** `CLAUDE.md` specifies React Hook Form + Zod for all forms, and the approved plan
for the investigation setup screen called for installing shadcn's `form` primitive (its
dedicated RHF+Zod integration component) alongside `card`/`input`/`label`/`textarea`/
`radio-group`. `npx shadcn add form` silently no-op'd; `shadcn view @shadcn/form` showed the
registry item exists but ships with `type: "registry:ui"` and no `files` at all in this shadcn
generation (`shadcn@4.21.0`, `radix-nova` style) — Radix's own `radix-ui` package now exports a
`Form` primitive directly, and this shadcn generation appears to point at that instead of
vendoring a copy-paste wrapper.

**Options:** Hand-write a `components/ui/form.tsx` wrapper around Radix's `Form` primitive to
match the plan literally / wire RHF directly against the already-installed `Input`/`Textarea`/
`Label`/`RadioGroup` via `register`/`Controller`, no wrapper.

**Chose:** Direct `register`/`Controller` wiring, no form wrapper component.

**Why:** There's nothing in this shadcn generation's registry to install — building one from
scratch would be exactly the "unnecessary generic component" `ProjectInst.md` §33 warns against
for a single form. `register`/`Controller` is standard RHF and equally explicit.

**Tradeoff:** Every future form (§43's follow-up input included) repeats this pattern by hand
instead of through a shared primitive. Worth revisiting only if a third or fourth form makes the
duplication actually costly.

## 2026-09-15 — `/api/investigate` streams over one held-open POST, not literal SSE

**Context:** PRD §31 wants real research progress, not fake agent theater, and Tavily's Research
API genuinely supports SSE streaming (confirmed live: `event: chat.completion.chunk` frames with
real `Planning`/`WebSearch`/`Generating` tool activity). The natural browser-native way to consume
server-sent events is `EventSource` against a `GET` endpoint, with a separate `POST` to create the
task — but `EventSource` can't carry a POST body, so that shape needs a create-then-poll/stream
pattern across two requests. On Vercel serverless, a Route Handler has no state that survives
between two separate requests, and ProjectInst.md §9 explicitly forbids adding a queue/DB/Redis
just to bridge that gap for V1.

**Options:** Two-endpoint create+poll design (needs a persistence layer we're told not to add) /
one long-lived `POST /api/investigate` request held open for the whole pipeline, with the server
writing newline-delimited JSON progress events into the response body as work actually happens,
read incrementally by the client via `fetch` + `ReadableStream` instead of `EventSource`.

**Chose:** The single held-open POST, NDJSON-framed (not literal `text/event-stream`).

**Why:** Delivers the same real-time, real-backend-state progress UX PRD wants, without adding
infrastructure V1 explicitly shouldn't have. No task ever needs to be looked up by a second
request, so there's nothing to persist.

**Tradeoff:** Not literal SSE — a client can't use `EventSource`'s built-in reconnect. If the
connection drops mid-investigation, the whole request has to restart (no resume-from-task-id).
Acceptable for V1's single-user, single-session investigation flow; would need revisiting for a
future multi-device/resumable-investigation feature.

## 2026-09-15 — One Tavily Research task per selected goal, not one query for the whole investigation

**Context:** PRD §38 wants dynamically generated, focused searches rather than one giant query.
Tavily's Research API takes a single natural-language `input` per task and does its own internal
multi-query decomposition — so "focused searches" has to be decided at the level of how many
Research tasks we create, not how many raw search queries we hand-write.

**Options:** One Research task per investigation (single `input` covering all selected goals) /
one Research task per selected goal, run concurrently.

**Chose:** One task per goal, concurrent (`Promise.all`).

**Why:** Gives real per-goal progress stages that map directly to PRD §31's mockup (e.g.
"Investigating AI signals" is one task's real lifecycle, not an invented label), and each
`Finding.investigationArea` falls out for free from knowing which task produced it — no separate
classification step needed for that field.

**Tradeoff:** N Tavily credits per investigation instead of 1 (N = goals selected, typically
3-6). Mitigated by defaulting every task to Tavily's `model: "mini"` (moderate budget per §40).

## 2026-09-15 — Synthesis model never sees or produces raw source URLs

**Context:** §16's no-hallucinated-sources rule is the product's central promise. A prompt
instruction ("don't fabricate URLs") is compliance-dependent; PRD §22 wants structured output
validated end-to-end instead of trusted on faith.

**Options:** Ask the synthesis model to reproduce `title`/`url`/`domain` for each citation
directly (relies on the model copying accurately) / have it cite sources only by a `ref` id
(e.g. "S1") constrained to an enum built from the exact source pool Tavily actually returned,
then resolve `url`/`title`/`domain`/`accessedAt` from that pool ourselves afterward.

**Chose:** Ref-based citation, resolved server-side, never from model output.

**Why:** Makes fabricated URLs structurally impossible rather than merely prompted against — the
model literally cannot express a URL in its structured output, since the schema has no such
field. `sourceTier` is likewise computed deterministically from the domain (see
`classifySourceTier`) rather than asked of the model, for the same reason; only `relevance`
(genuinely a contextual judgment) is model-assigned.

**Tradeoff:** More moving parts — a source pool has to be built and deduped before synthesis can
even construct its schema (the ref enum depends on it), and the synthesis prompt has to spell out
the pool for the model to cite from. Worth it for a guarantee this central to the product.

## 2026-09-15 — Primary synthesis provider switched from Gemini to Mistral

**Context:** The first version of Phase 2 shipped with Gemini as primary synthesis provider (see
the 2026-09-15 "Gemini + Groq for synthesis" entry above). Live end-to-end testing that same day
exhausted Gemini's free-tier quota (`generate_content_free_tier_requests`, limit 20/day) — Gemini
became unavailable for the rest of the day after a handful of real pipeline runs, well before any
real usage volume.

**Options:** Wait out / upgrade the Gemini quota and keep Gemini primary / switch primary to
Mistral (Shiyaa's call, key supplied directly) / drop the fallback pattern entirely.

**Chose:** Mistral as primary synthesis provider, Groq remains the fallback — same
retry-then-fallback-then-fail-gracefully design as before, just swapping which provider is
tried first. `src/lib/ai/gemini.ts` deleted; `src/lib/ai/mistral.ts` added
(`callMistralStructured`, `POST https://api.mistral.ai/v1/chat/completions`, OpenAI-compatible
`response_format: {type: "json_schema", json_schema: {name, schema, strict: true}}` — same
shape as Groq, since Mistral's chat completions API is OpenAI-compatible). `MISTRAL_API_KEY`
replaces `GEMINI_API_KEY` in `.env`/`.env.example`/`CLAUDE.md`.

Model actually used: `ministral-3b-2512`, not `mistral-large-latest`/`mistral-medium-latest` as
first tried — this account's key returned `x-ratelimit-limit-req-minute: 0` for medium (and a
403 "not available in your subscription tier" for large), confirmed live via response headers;
`ministral-3b` is what's actually usable on this tier (750 req/min). Live-verified the smaller
model handles the full synthesis schema/prompt correctly, though it initially conflated the
`evidence` field (meant to hold descriptive excerpts) with `sourceRefs` (citation ids) — fixed
by adding an explicit instruction distinguishing the two to `SYNTHESIS_PROMPT_V1`, re-verified
live afterward.

**Why:** Shiyaa's decision, made directly in response to the quota problem reported after Phase
2's live verification — a 20-request daily cap makes Gemini impractical even for continued
development, let alone real usage.

**Tradeoff:** A 3B model is meaningfully smaller than Groq's 20B fallback or what
medium/large-tier Mistral would have been — the evidence/sourceRefs confusion above is a real
symptom of that, worth keeping an eye on for other subtle instruction-following gaps as more of
the pipeline gets built. Groq's own fallback behavior (see the "structured output" decision in
Phase 2) is now the only safety net if Mistral also hits a limit or outage — worth watching for
the same
kind of quota surprise Gemini had, though Mistral's paid key (vs. Gemini's free tier) should not
have the same low daily cap. Whether to revert to OpenAI at deployment (open item since Phase 0)
is unaffected either way.

## 2026-09-15 — Mistral model bumped from ministral-3b to ministral-14b

**Context:** The Gemini→Mistral switch above shipped with `ministral-3b-2512`, the smallest
model confirmed usable on this key's tier at the time — `mistral-large`/`medium` were both
unusable (403 / a confirmed-live 0 req/min cap). 3b worked but was the model that produced the
evidence/sourceRefs field confusion the prompt fix above addresses. Shiyaa asked directly whether
`ministral-14b-2512` would help.

**Options:** Keep `ministral-3b` (cheapest, fastest, already working) / bump to `ministral-14b`
(untested at the time) / keep pushing on `mistral-medium`'s 0 req/min cap (a tier/billing
problem, not something retrying fixes).

**Chose:** `ministral-14b-2512`. Checked live first, same rigor as every other provider call in
this build: confirmed usable (`x-ratelimit-limit-req-minute: 30`, `~937K tokens/min` — plenty for
one synthesis call per investigation, unlike medium's 0), then ran a real end-to-end pipeline
call against the actual Taxfix JD before committing to the change.

**Why:** The live run succeeded on Mistral's first attempt (no retry, no Groq fallback needed)
and produced a richer, cleaner result than 3b's first run: 13 findings and 13 open questions
(vs. 9 and 5), correctly separated `evidence` (descriptive excerpts) from `sourceRefs` (clean ids)
without needing the corrective prompt instruction to kick in, and used
`evidence_backed_inference` vs. `fact` appropriately across different claims in the same
result — the fact/inference distinction is the single most load-bearing product behavior
(ProjectInst §23), so a model that holds it more reliably is worth the small rate-limit headroom
tradeoff.

**Tradeoff:** 30 req/min instead of 3b's 750 — still far more than this pipeline's one-call
-per-investigation pattern needs, but worth knowing if investigation volume ever scales up
significantly before a further model/tier decision.

## 2026-09-15 — CI skips `verify` for doc-only changes, without `paths-ignore`

**Context:** Shiyaa asked not to run the full lint/typecheck/test/build pipeline for
documentation-only commits — they don't touch anything those checks would catch. The obvious
fix, `paths-ignore: ['**/*.md']` on the workflow's `on:` trigger, has a real gotcha: `main`'s
branch ruleset requires a status check with context `"verify"` (confirmed via
`gh api repos/.../rulesets/23427935`). If the workflow never triggers for a doc-only commit,
that commit never gets a `"verify"` report at all, and GitHub's required-status-check leaves the
PR stuck on "Expected — waiting for status" indefinitely — not a check that reports skipped, a
check that never shows up.

**Options:** `paths-ignore` at the trigger level (breaks required-status-checks, as above) /
leave CI as-is, always running full checks / keep the workflow triggering every time, but make
the `verify` job itself conditionally skip its work when the diff is doc-only.

**Chose:** The third option. Added a cheap `changes` job (using `dorny/paths-filter`, a
well-established action for this exact purpose rather than hand-rolled `git diff` parsing) that
outputs whether any non-`.md` file changed; `verify` now has `needs: changes` and
`if: needs.changes.outputs.code == 'true'`. The workflow still triggers on every push/PR, so
`main`'s ruleset always gets a report for the `"verify"` context — it's just reported as
**skipped** (which satisfies a required check) rather than run, when nothing but docs changed.

**Why:** This is the standard, documented pattern for conditionally-required GitHub Actions
checks. Confirmed live: a PR touching only `.github/workflows/ci.yml` (non-`.md`) correctly
triggered and passed the full `verify` job — the "normal" path is proven. The doc-only skip
path will get its first real-world exercise on the next genuine doc-only PR once this merges.

**Tradeoff:** One more job in the workflow file, and a dependency on `dorny/paths-filter` (a
GitHub Action, not an npm package — outside the app's own dependency policy, but still a
third-party action to trust). If this pattern is ever "simplified" back to a plain
`paths-ignore`, branch protection breaks silently for the next doc-only PR — worth remembering
before touching this file again.

## 2026-09-15 — Dashboard reads the Zustand-persisted result, no investigation ID/route param

**Context:** Building Phase 3's progress screen + a first-pass dashboard
(`/investigate/results`). The dashboard needs the completed `InvestigationResult`, but there's
no server-side store beyond the one held-open `POST /api/investigate` request (ProjectInst §9,
already decided in the NDJSON-over-SSE entry above) — no DB, no generated investigation ID to
fetch by.

**Chose:** The progress screen calls `setResult()` on the same Zustand store that already holds
`setup` (persisted to localStorage) when the `result` pipeline event arrives, then does a
client-side `router.push("/investigate/results")`. The dashboard route reads `setup`/`result`
straight from the store; if either is missing (direct nav, refresh after localStorage was
cleared, etc.) it redirects to `/investigate` rather than erroring.

**Why:** Consistent with the existing setup-flow pattern (`commitSetup` → `/investigate/progress`
already worked this way) and avoids introducing a fetch-by-ID architecture the app has no backing
store for. `commitSetup` now also clears any stale `result` when a new investigation starts, so
the dashboard never shows a previous run's data under a new company/role.

**Tradeoff:** No shareable/bookmarkable URL per investigation, and a hard refresh on
`/investigate/results` before Phase 6's reload/resume work is fully in place could show a stale
result if `setup` changed but `result` didn't get cleared for some reason. Acceptable for now —
Phase 6 (`ROADMAP.md`) already owns full reload/resume semantics; this doesn't block it.

## 2026-09-15 — Progress screen fetch cost under Next dev's StrictMode double-invoke

**Context:** Wiring `/investigate/progress` to the real `POST /api/investigate` stream inside a
`useEffect`. Next's dev server wraps the app in `React.StrictMode`, which intentionally
mount→cleanup→mount's every effect once in development to catch effects that aren't cleanup-safe.

**Chose:** Used a real `AbortController`, created in the effect and aborted in its cleanup, and
let both StrictMode invocations actually fire `fetch("/api/investigate", ...)` — the first
request gets aborted client-side almost immediately, the second one is the one that actually
completes and drives the UI. This is the standard React-recommended pattern for effects with
fetch (make cleanup genuinely cancel the request, don't try to suppress the second invocation
with a ref guard — a ref guard here would silently break the flow entirely, since cleanup would
cancel the only request that was allowed to start).

**Why:** Correctness over cleverness — a guard that tries to dodge StrictMode's double-invoke
by skipping the second effect run doesn't know that cleanup already cancelled the first one, so
the app would end up with zero live streams and a progress screen that never updates.

**Tradeoff:** In `npm run dev` specifically (not `next build`/`next start`, and not
production), the very first page load of `/investigate/progress` in a session will send two real
`POST /api/investigate` requests — meaning two live Tavily/Mistral/Groq runs — before the
aborted one is cut off client-side (the server-side pipeline for the aborted request isn't
currently wired to `request.signal`, so it keeps running to completion regardless, and its
result is just discarded). Worth knowing before manually testing this flow with real API keys:
each dev-mode test click through the full flow costs roughly 2x one investigation's API spend,
not 1x. Wiring `request.signal` through the pipeline to actually cancel the aborted run
server-side, or starting the fetch from the setup form's submit handler instead of an effect,
would remove this — not done here to avoid over-engineering ahead of a real need; flagged for
Shiyaa to decide if it's worth doing before heavier manual testing begins.

## 2026-09-15 — Company Briefing is a synthesis-model output, not client-derived

**Context:** Shiyaa asked for the dashboard's first section — company summary + up to 5 tags
(acquisitions/headcount/revenue/awards), an ideal-fit summary + top 3 skills, and 5
role-specific highlights each with a one-line "why it matters." The skills and highlights must
come from actual research, explicitly not from the job description text, and must not be
false claims or hallucinations.

**Options considered:** Derive this client-side from the existing `Finding[]` already in
`InvestigationResult` (e.g. pick findings tagged `investigationArea: "company"`/`"role"` and
reshape them) / add a new structured `companyBriefing` object to the synthesis model's own
output schema, using the same ref-constrained-citation mechanism `findings` already has.

**Chose:** The second option. `companyBriefing` is now part of `buildSynthesisOutputSchema`
(`lib/schemas/evidence.ts`), with every tag/skill/highlight requiring `sourceRefs.min(1)` — the
same enum-constrained-to-the-real-pool mechanism that already makes fabricated URLs
structurally impossible for `findings`. `SYNTHESIS_PROMPT_V1` gained explicit rules: the JD is
available to the model only to know what role is being evaluated against, never as a source of
fact for `idealFitSkills`/`roleHighlights`; omit an item rather than invent one to hit the
5/3/5 caps.

**Why:** Picking "the top 5 acquisitions/revenue/etc." out of unstructured `Finding.claim` text
on the client, without the model's own judgment and citation discipline in the loop, is exactly
the kind of ungrounded inference PRD §35 (hallucination guardrails) and §36 (citation rule)
exist to prevent — there'd be no structural guarantee the picked items were actually
evidence-backed, only a hope the heuristic picked well-sourced findings. The synthesis model
already receives the full JD and all raw research in one call, so no new research/Tavily stage
was needed — this is additive to the existing synthesis step, not a new pipeline stage.

**Tradeoff:** One more thing that can fail schema validation and trigger the corrective-retry
path (`attemptProvider` in `synthesis.ts`) — a slightly larger structured-output surface for
Mistral/Groq to get right in one call. Caps are maximums, not exact counts, so a
weak-evidence investigation may show fewer than 5 tags/3 skills/5 highlights, or an honest
"not enough evidence" empty state per sub-section — this is intentional, not a bug.

## 2026-09-15 — Reversed the StrictMode-fetch decision above: skip the duplicate entirely

**Context:** The "flagged for Shiyaa to decide" tradeoff in the entry above turned out worse
than predicted, confirmed live: a real test run showed two concurrent
`POST /api/investigate` pipelines (server log had two full sets of per-goal failures from one
page load, plus `Investigation pipeline crashed: TypeError: Invalid state: Controller is
already closed` — the orphaned duplicate's pipeline kept running against a stream controller
the platform had already torn down once its client-side fetch was aborted, and every
subsequent `send()` in that orphaned pipeline threw the same error). This wasn't just wasted
spend as predicted — doubling concurrent Tavily load from one page click is a likely
contributor to hitting Tavily's real plan-limit (432) on the _visible_ investigation too
(`company`/`people` failed there in the same run).

**Chose:** Reverted to a `useRef` "started" guard that skips StrictMode's second effect
invocation entirely — no `AbortController`, no cleanup. `readInvestigationStream` no longer
takes a `signal` param.

**Why:** The previous entry rejected a ref guard on the reasoning that cleanup would cancel
the only request StrictMode's double-invoke lets through, leaving zero live streams. That
reasoning was correct for a _cleanup-that-aborts_ combined with a ref guard — but it doesn't
apply to a ref guard _without_ a cleanup at all. This is a one-time, non-idempotent action
(real API spend), not a subscription — React's own guidance explicitly carves out exactly this
case as a valid use of a ref guard, distinct from the general "don't fight StrictMode" advice
for subscriptions/timers. Skipping the second invocation outright — rather than starting it
and aborting it — is what actually prevents the duplicate server-side pipeline from ever
starting, since abort was never able to stop the server-side work anyway (no `request.signal`
wiring into the pipeline).

**Tradeoff:** A genuine unmount mid-research (user navigates away from `/investigate/progress`
manually) no longer cancels anything client-side either — but it never actually stopped the
server-side pipeline before now, so this gives up nothing that was real. `key={attempt}` on
`InvestigationRun` still resets the ref on retry, so each retry still fires exactly once.

## 2026-09-15 — Hard cap of 5 investigation goals per investigation

**Context:** A live test run consumed 464 Tavily credits in one investigation. Checked
Tavily's Research API docs directly: the only cost lever is `model` (`mini` vs `pro`, already
on `mini`), and `mini` itself costs a dynamic **4-110 credits per call** — "how much internal
research the agent does," with no documented max-results/search-depth/budget parameter to
bound it further. Since one Research call runs per selected goal, concurrently (§38), total
spend per investigation scales with goal count, and that's the only lever actually available
to us.

**Options:** No cap, just a cost hint next to the goal picker (soft guidance, no enforcement) /
hard cap on how many goals can be selected at once / switch goal research from concurrent to
sequential with a running-total early-stop (requires Tavily to report per-call credit usage in
the response, which isn't confirmed to exist, and would sacrifice the concurrent-research
architecture already decided for real per-goal progress).

**Chose:** A hard cap of 5 goals per investigation (`MAX_INVESTIGATION_GOALS` in
`lib/investigation-goals.ts`), enforced in `investigationSetupSchema` (server-trusted) and
mirrored in the setup UI (disables further goal checkboxes once 5 are selected, rather than
only surfacing a validation error after submit).

**Why:** Confirmed with Shiyaa directly (a cost decision, not something to guess at) — a hard
cap over a soft warning, since a soft warning still lets one investigation blow through most of
a monthly credit budget. 5 was chosen as worst case (5 × mini's 110-credit ceiling = 550
credits) leaves headroom for more than one investigation per 1,000-credit month even at the
worst case, while matching the "top 5" framing already used elsewhere in the product (company
tags, role highlights).

**Tradeoff:** A candidate who wants to investigate more than 5 areas at once can't — they'd
need to run a follow-up investigation or accept narrower initial scope. Revisit the number if
Tavily's actual per-call cost in practice sits meaningfully below the 110-credit ceiling once
more real usage data exists.
