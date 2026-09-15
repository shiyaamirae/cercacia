import { Badge } from "@/components/ui/badge";
import type { CompanyBriefing } from "@/types/investigation";

const NOT_ENOUGH_EVIDENCE = "Not enough evidence to identify this yet.";

function sourceCountLabel(count: number): string {
  return `${count} source${count === 1 ? "" : "s"} on file`;
}

type CompanyBriefingSectionProps = {
  companyBriefing: CompanyBriefing;
};

export function CompanyBriefingSection({
  companyBriefing,
}: CompanyBriefingSectionProps) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-foreground">{companyBriefing.companySummary}</p>
        {companyBriefing.companyTags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {companyBriefing.companyTags.map((tag) => (
              <Badge
                key={tag.label}
                variant="outline"
                title={sourceCountLabel(tag.sources.length)}
              >
                {tag.label}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {NOT_ENOUGH_EVIDENCE}
          </p>
        )}
      </div>

      <div>
        <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Who they&rsquo;re likely looking for
        </p>
        <p className="text-foreground">{companyBriefing.idealFitSummary}</p>
        {companyBriefing.idealFitSkills.length > 0 ? (
          <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5 text-sm text-foreground">
            {companyBriefing.idealFitSkills.map((item) => (
              <li key={item.skill}>{item.skill}</li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            {NOT_ENOUGH_EVIDENCE}
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          What matters for this role
        </p>
        {companyBriefing.roleHighlights.length > 0 ? (
          <ol className="flex list-decimal flex-col gap-3 pl-5">
            {companyBriefing.roleHighlights.map((item) => (
              <li key={item.point} className="text-sm">
                <p className="text-foreground">{item.point}</p>
                <p className="mt-0.5 text-muted-foreground">
                  {item.whyItMatters}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">{NOT_ENOUGH_EVIDENCE}</p>
        )}
      </div>
    </div>
  );
}
