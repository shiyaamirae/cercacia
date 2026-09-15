import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Finding, FindingClassification } from "@/types/investigation";

const CLASSIFICATION_LABEL: Record<FindingClassification, string> = {
  fact: "Fact",
  evidence_backed_inference: "Evidence-backed inference",
  inference: "Inference",
  unknown: "Unknown",
  contradicted: "Contradicted",
};

const CLASSIFICATION_BADGE_VARIANT: Record<
  FindingClassification,
  "default" | "secondary" | "outline"
> = {
  fact: "default",
  evidence_backed_inference: "secondary",
  inference: "secondary",
  unknown: "outline",
  contradicted: "outline",
};

type KeySignalCardProps = {
  finding: Finding;
};

export function KeySignalCard({ finding }: KeySignalCardProps) {
  return (
    <Card>
      <CardHeader className="gap-3">
        <p className="font-display text-lg leading-snug">{finding.claim}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant={CLASSIFICATION_BADGE_VARIANT[finding.classification]}>
            {CLASSIFICATION_LABEL[finding.classification]}
          </Badge>
          <span className="text-muted-foreground">
            Confidence:{" "}
            {finding.confidence.charAt(0).toUpperCase() +
              finding.confidence.slice(1)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 text-sm">
        <div>
          <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Why it matters
          </p>
          <p className="text-foreground">{finding.whyItMatters}</p>
        </div>

        <p className="text-xs text-muted-foreground">
          {finding.sources.length} source
          {finding.sources.length === 1 ? "" : "s"} on file
        </p>

        {finding.limitations && (
          <div>
            <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              What we do NOT know
            </p>
            <p className="text-muted-foreground">{finding.limitations}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
