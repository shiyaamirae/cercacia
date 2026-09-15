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
