import { NO_OPEN_QUESTIONS } from "@/components/investigation/section-copy";

type OpenQuestionsSectionProps = {
  openQuestions: string[];
};

export function OpenQuestionsSectionView({
  openQuestions,
}: OpenQuestionsSectionProps) {
  if (openQuestions.length === 0) {
    return <p className="text-sm text-muted-foreground">{NO_OPEN_QUESTIONS}</p>;
  }

  return (
    <ul className="flex list-disc flex-col gap-2 pl-5">
      {openQuestions.map((question) => (
        <li key={question} className="text-sm text-foreground">
          {question}
        </li>
      ))}
    </ul>
  );
}
