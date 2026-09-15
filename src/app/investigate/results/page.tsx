"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MotionConfig, motion } from "motion/react";
import { CompanyBriefingSection } from "@/components/investigation/company-briefing-section";
import { useInvestigationStore } from "@/lib/store/investigation-store";
import { investigationResultSchema } from "@/lib/schemas/evidence";

const easeOut = [0.16, 1, 0.3, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: easeOut, delay: i * 0.06 },
  }),
};

const closedDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default function InvestigationResultsPage() {
  const router = useRouter();
  const setup = useInvestigationStore((state) => state.setup);
  const rawResult = useInvestigationStore((state) => state.result);
  // Guards against a result persisted by an older app version (localStorage
  // survives across deploys/hot-reloads) whose shape no longer matches —
  // e.g. missing a field added since, like companyBriefing.
  const parsedResult = rawResult
    ? investigationResultSchema.safeParse(rawResult)
    : null;
  const result = parsedResult?.success ? parsedResult.data : null;

  useEffect(() => {
    if (!setup || !result) {
      router.replace("/investigate");
    }
  }, [setup, result, router]);

  if (!setup || !result) return null;

  const sourceCount = new Set(
    result.findings.flatMap((finding) =>
      finding.sources.map((source) => source.url)
    )
  ).size;
  const highConfidenceCount = result.findings.filter(
    (finding) => finding.confidence === "high"
  ).length;

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto w-full max-w-3xl px-6 py-14 sm:px-10">
        <motion.p
          custom={0}
          initial="hidden"
          animate="visible"
          variants={reveal}
          className="mb-2 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase"
        >
          Case file
        </motion.p>

        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={reveal}
        >
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
            {setup.company}
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">{setup.role}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Investigation closed · {closedDateFormatter.format(new Date())}
          </p>
        </motion.div>

        <motion.dl
          custom={2}
          initial="hidden"
          animate="visible"
          variants={reveal}
          className="mt-8 grid grid-cols-3 gap-x-6 gap-y-4 border-y border-border py-5"
        >
          {[
            ["Sources", sourceCount],
            ["Findings", result.findings.length],
            ["High-confidence", highConfidenceCount],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {label}
              </dt>
              <dd className="font-display text-2xl">{value}</dd>
            </div>
          ))}
        </motion.dl>

        <motion.section
          custom={3}
          initial="hidden"
          animate="visible"
          variants={reveal}
          className="mt-8"
        >
          <h2 className="font-display mb-4 text-xl">Company briefing</h2>
          <CompanyBriefingSection companyBriefing={result.companyBriefing} />
        </motion.section>
      </main>
    </MotionConfig>
  );
}
