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
