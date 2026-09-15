const MISTRAL_CHAT_URL = "https://api.mistral.ai/v1/chat/completions";
// mistral-medium/large are rate-capped to 0 req/min on this account's tier
// (confirmed live via response headers). ministral-14b is: available (30
// req/min, ~937K tokens/min — plenty for one synthesis call per
// investigation), and live-verified to follow the evidence/sourceRefs
// distinction more reliably than ministral-3b did.
const MISTRAL_MODEL = "ministral-14b-2512";

export class MistralError extends Error {}

type MistralChatCompletion = {
  choices?: Array<{ message?: { content?: string } }>;
};

/**
 * Calls Mistral's JSON-schema structured output and returns the parsed JSON
 * value (unvalidated — callers Zod-validate against the schema they passed).
 * Primary synthesis provider (Groq is the fallback) — see DECISIONS.md for
 * why Gemini was replaced.
 */
export async function callMistralStructured(
  prompt: string,
  schema: object,
  schemaName: string
): Promise<unknown> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new MistralError("MISTRAL_API_KEY is not configured");

  const response = await fetch(MISTRAL_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: { name: schemaName, strict: true, schema },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new MistralError(
      `Mistral request failed with status ${response.status}: ${errorBody.slice(0, 500)}`
    );
  }

  const body = (await response.json()) as MistralChatCompletion;
  const text = body.choices?.[0]?.message?.content;
  if (typeof text !== "string") {
    throw new MistralError("Mistral response did not contain message content");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new MistralError("Mistral response was not valid JSON");
  }
}
