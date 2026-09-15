import {
  NOT_ENOUGH_EVIDENCE,
  sourceCountLabel,
} from "@/components/investigation/section-copy";
import type { RelevantWorkSection } from "@/types/investigation";

const publishedDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function publishedLabel(publishedAt: string | null): string {
  if (!publishedAt) return "Publication date unavailable";
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return "Publication date unavailable";
  return `Published ${publishedDateFormatter.format(date)}`;
}

type RelevantWorkSectionProps = {
  relevantWork: RelevantWorkSection;
};

export function RelevantWorkSectionView({
  relevantWork,
}: RelevantWorkSectionProps) {
  if (relevantWork.items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{NOT_ENOUGH_EVIDENCE}</p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {relevantWork.items.map((item) => (
        <li key={item.title} title={sourceCountLabel(item.sources.length)}>
          <p className="text-sm font-medium text-foreground">{item.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{item.summary}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {publishedLabel(item.publishedAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}
