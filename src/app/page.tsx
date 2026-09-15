"use client";

import Link from "next/link";
import { MotionConfig, motion } from "motion/react";

const easeOut = [0.16, 1, 0.3, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: easeOut, delay: i * 0.07 },
  }),
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export default function HomePage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between gap-3 px-4 py-5 sm:px-10">
          <span className="font-display shrink-0 text-lg tracking-tight">
            CercaCia
          </span>
          <Link
            href="/investigate"
            className={`inline-flex shrink-0 items-center whitespace-nowrap text-xs text-muted-foreground transition-colors sm:text-sm hover:text-primary ${focusRing}`}
          >
            Start investigation
          </Link>
        </header>

        <main className="flex flex-1 items-center px-6 sm:px-10">
          <div className="max-w-2xl pt-14 pb-24 sm:pt-20 sm:pb-28">
            <motion.p
              custom={0}
              initial="hidden"
              animate="visible"
              variants={reveal}
              className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground"
            >
              Evidence-backed investigation
            </motion.p>

            <motion.h1
              custom={1}
              initial="hidden"
              animate="visible"
              variants={reveal}
              className="font-display text-4xl font-normal leading-[1.08] tracking-tight sm:text-5xl md:text-[3.4rem]"
            >
              Investigate before you apply.
            </motion.h1>

            <motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={reveal}
              className="mt-6 max-w-[52ch] text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              Go beyond the job description. Tell us what you want to understand
              about the company and role. CercaCia researches public sources and
              shows you what the evidence actually supports.
            </motion.p>

            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={reveal}
              className="mt-10"
            >
              <Link
                href="/investigate"
                className={`inline-flex items-center whitespace-nowrap text-lg font-medium text-primary underline decoration-1 underline-offset-2 transition-[text-decoration-thickness] hover:decoration-2 ${focusRing}`}
              >
                Start investigation →
              </Link>
            </motion.div>
          </div>
        </main>

        <footer className="border-t border-border px-6 py-5 text-center font-mono text-xs text-muted-foreground sm:px-10 sm:text-left">
          © 2026 CercaCia
        </footer>
      </div>
    </MotionConfig>
  );
}
