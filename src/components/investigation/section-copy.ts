export const NOT_ENOUGH_EVIDENCE = "Not enough evidence to identify this yet.";

export function sourceCountLabel(count: number): string {
  return `${count} source${count === 1 ? "" : "s"} on file`;
}
