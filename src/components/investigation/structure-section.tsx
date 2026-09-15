import {
  NOT_ENOUGH_EVIDENCE,
  sourceCountLabel,
} from "@/components/investigation/section-copy";
import type { StructureSection } from "@/types/investigation";

type StructureSectionProps = {
  structure: StructureSection;
};

export function StructureSectionView({ structure }: StructureSectionProps) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Teams
        </p>
        {structure.teams.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {structure.teams.map((team) => (
              <li key={team.name} title={sourceCountLabel(team.sources.length)}>
                <p className="text-sm text-foreground">{team.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {team.note}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{NOT_ENOUGH_EVIDENCE}</p>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          What to know before applying
        </p>
        {structure.orgNotes.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {structure.orgNotes.map((item) => (
              <li
                key={item.point}
                className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground"
                title={sourceCountLabel(item.sources.length)}
              >
                {item.point}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{NOT_ENOUGH_EVIDENCE}</p>
        )}
      </div>
    </div>
  );
}
