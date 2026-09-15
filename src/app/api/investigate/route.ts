import type { NextRequest } from "next/server";
import { investigationSetupSchema } from "@/lib/schemas/investigation";
import {
  runInvestigationPipeline,
  type PipelineEvent,
} from "@/lib/research/pipeline";

/**
 * Streams newline-delimited JSON `PipelineEvent`s for the duration of one
 * investigation. Not literal `text/event-stream` SSE — there's no separate
 * task-creation step to poll or reconnect to (this app has no server-side
 * store beyond this one held-open request, by design — see DECISIONS.md),
 * so the client reads this response body incrementally instead of using
 * `EventSource` (which can't carry a POST body anyway).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = investigationSetupSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { ok: false, reason: "invalid_input", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();
  const setup = parsed.data;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: PipelineEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        await runInvestigationPipeline(setup, send);
      } catch (error) {
        console.error("Investigation pipeline crashed:", error);
        send({ type: "error", reason: "provider_failure" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
