"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MotionConfig, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useInvestigationStore } from "@/lib/store/investigation-store";
import { INVESTIGATION_GOALS } from "@/lib/investigation-goals";
import { goalStageLabel, failureCopy } from "@/lib/research/progress-copy";
import { parseNdjsonChunk } from "@/lib/research/ndjson";
import type { GoalStage, PipelineEvent } from "@/lib/research/pipeline";
import type {
  InvestigationArea,
  InvestigationSetup,
} from "@/types/investigation";
import type { SynthesisFailureReason } from "@/lib/ai/synthesis";

const easeOut = [0.16, 1, 0.3, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 6 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: easeOut, delay: i * 0.05 },
  }),
};

type Phase = "researching" | "synthesizing" | "error" | "done";

function initialStages(
  goals: InvestigationArea[]
): Record<InvestigationArea, GoalStage> {
  return Object.fromEntries(
    goals.map((goal) => [goal, "searching" as GoalStage])
  ) as Record<InvestigationArea, GoalStage>;
}

function stageGlyph(stage: GoalStage) {
  if (stage === "complete") return "✓";
  if (stage === "failed") return "×";
  return "●";
}

async function readInvestigationStream(
  setup: InvestigationSetup,
  signal: AbortSignal,
  onEvent: (event: PipelineEvent) => void
): Promise<void> {
  const response = await fetch("/api/investigate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(setup),
    signal,
  });

  if (!response.body) {
    onEvent({ type: "error", reason: "provider_failure" });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const { events, remainder } = parseNdjsonChunk(buffer);
    buffer = remainder;
    events.forEach(onEvent);
  }
}

export default function InvestigationProgressPage() {
  const router = useRouter();
  const setup = useInvestigationStore((state) => state.setup);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!setup) {
      router.replace("/investigate");
    }
  }, [setup, router]);

  if (!setup) return null;

  return (
    <InvestigationRun
      key={attempt}
      setup={setup}
      onRetry={() => setAttempt((n) => n + 1)}
    />
  );
}

type InvestigationRunProps = {
  setup: InvestigationSetup;
  onRetry: () => void;
};

function InvestigationRun({ setup, onRetry }: InvestigationRunProps) {
  const router = useRouter();
  const setResult = useInvestigationStore((state) => state.setResult);

  const [phase, setPhase] = useState<Phase>("researching");
  const [stages, setStages] = useState<Record<InvestigationArea, GoalStage>>(
    () => initialStages(setup.goals)
  );
  const [errorReason, setErrorReason] =
    useState<SynthesisFailureReason>("provider_failure");

  useEffect(() => {
    const controller = new AbortController();

    readInvestigationStream(setup, controller.signal, (event) => {
      if (event.type === "goal_stage") {
        setStages((current) => ({ ...current, [event.goal]: event.stage }));
      } else if (event.type === "synthesizing") {
        setPhase("synthesizing");
      } else if (event.type === "result") {
        setResult(event.result);
        setPhase("done");
        router.push("/investigate/results");
      } else if (event.type === "error") {
        setErrorReason(event.reason);
        setPhase("error");
      }
    }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setErrorReason("provider_failure");
      setPhase("error");
    });

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup]);

  const failure = phase === "error" ? failureCopy(errorReason) : null;

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-16 sm:px-10">
        <motion.p
          custom={0}
          initial="hidden"
          animate="visible"
          variants={reveal}
          className="mb-2 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase"
        >
          Case in progress
        </motion.p>
        <motion.h1
          custom={1}
          initial="hidden"
          animate="visible"
          variants={reveal}
          className="font-display mb-8 text-3xl tracking-tight sm:text-4xl"
        >
          Investigating {setup.company}
        </motion.h1>

        {phase !== "error" ? (
          <ul className="flex flex-col gap-3">
            {setup.goals.map((goalId, index) => {
              const goal = INVESTIGATION_GOALS.find((g) => g.id === goalId);
              const stage = stages[goalId];
              const title = goal?.title ?? goalId;

              return (
                <motion.li
                  key={goalId}
                  custom={index + 2}
                  initial="hidden"
                  animate="visible"
                  variants={reveal}
                  className="flex items-center gap-3 text-sm"
                >
                  <span
                    aria-hidden
                    className={
                      stage === "failed"
                        ? "text-destructive"
                        : stage === "complete"
                          ? "text-primary"
                          : "text-muted-foreground"
                    }
                  >
                    {stageGlyph(stage)}
                  </span>
                  <span
                    className={
                      stage === "complete"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {goalStageLabel(title, stage)}
                  </span>
                </motion.li>
              );
            })}

            {phase === "synthesizing" && (
              <motion.li
                custom={setup.goals.length + 2}
                initial="hidden"
                animate="visible"
                variants={reveal}
                className="flex items-center gap-3 text-sm text-foreground"
              >
                <span aria-hidden>●</span>
                <span>Building the case</span>
              </motion.li>
            )}
          </ul>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-foreground">{failure?.message}</p>
            {failure?.canRetry && (
              <Button onClick={onRetry} className="w-fit">
                Try again
              </Button>
            )}
          </div>
        )}
      </main>
    </MotionConfig>
  );
}
