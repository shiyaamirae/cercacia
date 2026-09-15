import { Badge } from "@/components/ui/badge";
import {
  CLASSIFICATION_LABEL,
  CONFIDENCE_LABEL,
  NOT_ENOUGH_EVIDENCE,
} from "@/components/investigation/section-copy";
import type { Finding } from "@/types/investigation";

type EvidenceSectionProps = {
  findings: Finding[];
};

export function EvidenceSectionView({ findings }: EvidenceSectionProps) {
  if (findings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{NOT_ENOUGH_EVIDENCE}</p>
    );
  }

  return (
    <ul className="flex flex-col gap-6">
      {findings.map((finding) => (
        <li
          key={finding.id}
          className="border-b border-border pb-6 last:border-0 last:pb-0"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">
              {CLASSIFICATION_LABEL[finding.classification]}
            </Badge>
            <Badge variant="secondary">
              {CONFIDENCE_LABEL[finding.confidence]}
            </Badge>
          </div>

          <p className="mt-2 text-foreground">{finding.claim}</p>

          {finding.evidence.length > 0 && (
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
              {finding.evidence.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          )}

          <p className="mt-2 text-sm text-foreground">{finding.whyItMatters}</p>

          {finding.limitations && (
            <p className="mt-1 text-sm text-muted-foreground italic">
              {finding.limitations}
            </p>
          )}

          {finding.sources.length > 0 && (
            <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {finding.sources.map((source, index) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
                >
                  [{index + 1}] {source.domain}
                </a>
              ))}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
