const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-20b";
// gpt-oss-20b is a reasoning model — it spends a large share of the token
// budget on hidden reasoning before emitting the JSON itself. The default
// completion limit truncates that JSON mid-document, which then fails
// Groq's own strict-mode validation. Generous headroom avoids that.
const GROQ_MAX_COMPLETION_TOKENS = 8000;

export class GroqError extends Error {}

type GroqChatCompletion = {
  choices?: Array<{ message?: { content?: string } }>;
};

/**
 * Calls Groq's strict JSON-schema structured output and returns the parsed
 * JSON value (unvalidated — callers Zod-validate against the schema they
 * passed). Fallback provider when Gemini fails or is rate-limited.
 */
export async function callGroqStructured(
  prompt: string,
  schema: object,
  schemaName: string
): Promise<unknown> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new GroqError("GROQ_API_KEY is not configured");

  const response = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: GROQ_MAX_COMPLETION_TOKENS,
      response_format: {
        type: "json_schema",
        json_schema: { name: schemaName, strict: true, schema },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new GroqError(
      `Groq request failed with status ${response.status}: ${errorBody.slice(0, 500)}`
    );
  }

  const body = (await response.json()) as GroqChatCompletion;
  const text = body.choices?.[0]?.message?.content;
  if (typeof text !== "string") {
    throw new GroqError("Groq response did not contain message content");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new GroqError("Groq response was not valid JSON");
  }
}
