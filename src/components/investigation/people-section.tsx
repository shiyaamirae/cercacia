import {
  NOT_ENOUGH_EVIDENCE,
  sourceCountLabel,
} from "@/components/investigation/section-copy";
import type { PeopleSection, PersonEntry } from "@/types/investigation";

function PersonList({ people }: { people: PersonEntry[] }) {
  if (people.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{NOT_ENOUGH_EVIDENCE}</p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {people.map((person) => (
        <li
          key={`${person.name}-${person.title}`}
          title={sourceCountLabel(person.sources.length)}
        >
          <p className="text-sm text-foreground">
            {person.name}
            <span className="text-muted-foreground"> — {person.title}</span>
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{person.note}</p>
        </li>
      ))}
    </ul>
  );
}

type PeopleSectionProps = {
  people: PeopleSection;
};

export function PeopleSectionView({ people }: PeopleSectionProps) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Key people
        </p>
        <PersonList people={people.keyPeople} />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Likely hiring contacts
        </p>
        <PersonList people={people.hiringContacts} />
      </div>
    </div>
  );
}
