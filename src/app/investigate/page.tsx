"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SetupForm } from "@/components/investigation/setup-form";
import { InvestigationSummary } from "@/components/investigation/investigation-summary";
import {
  investigationSetupSchema,
  type InvestigationSetupInput,
  type InvestigationSetupValues,
} from "@/lib/schemas/investigation";
import { useInvestigationStore } from "@/lib/store/investigation-store";

export default function InvestigatePage() {
  const router = useRouter();
  const commitSetup = useInvestigationStore((state) => state.commitSetup);

  const form = useForm<
    InvestigationSetupInput,
    unknown,
    InvestigationSetupValues
  >({
    resolver: zodResolver(investigationSetupSchema),
    mode: "onBlur",
    defaultValues: {
      company: "",
      role: "",
      jobDescription: "",
      goals: [],
      customQuestion: "",
      freshness: "6_months",
    },
  });

  function onSubmit(values: InvestigationSetupValues) {
    commitSetup(values);
    router.push("/investigate/progress");
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pt-12 pb-28 sm:px-10 sm:pt-16 sm:pb-16 lg:pb-16">
      <div className="mb-10">
        <p className="mb-2 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          New investigation
        </p>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
          Set up your investigation.
        </h1>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-12"
        noValidate
      >
        <SetupForm form={form} />
        <InvestigationSummary form={form} />
      </form>
    </main>
  );
}
