const GEMINI_INTERACTIONS_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";
const GEMINI_MODEL = "gemini-3.8-flash";

export class GeminiError extends Error {}

type GeminiStep = {
  type: string;
  content?: Array<{ type: string; text?: string }>;
};

type GeminiInteraction = {
  steps?: GeminiStep[];
};

/**
 * Calls Gemini's structured-output endpoint and returns the parsed JSON
 * value (unvalidated — callers Zod-validate against the schema they passed).
 */
export async function callGeminiStructured(
  prompt: string,
  schema: object
): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiError("GEMINI_API_KEY is not configured");

  const response = await fetch(GEMINI_INTERACTIONS_URL, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GEMINI_MODEL,
      input: prompt,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new GeminiError(
      `Gemini request failed with status ${response.status}: ${errorBody.slice(0, 500)}`
    );
  }

  const body = (await response.json()) as GeminiInteraction;
  const modelOutput = body.steps?.find((step) => step.type === "model_output");
  const text = modelOutput?.content?.[0]?.text;
  if (typeof text !== "string") {
    throw new GeminiError("Gemini response did not contain model output text");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new GeminiError("Gemini response was not valid JSON");
  }
}
