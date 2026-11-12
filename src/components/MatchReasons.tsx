type MatchReasonsProps = {
  sharesMajor: boolean;
  major: string;
  sharedInterests: string[];
};

export function MatchReasons({
  sharesMajor,
  major,
  sharedInterests,
}: MatchReasonsProps) {
  const reasons = [
    ...(sharesMajor ? [major] : []),
    ...sharedInterests,
  ];
  if (reasons.length === 0) return null;

  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {reasons.map((reason) => (
        <li
          key={reason}
          className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700"
        >
          {reason}
        </li>
      ))}
    </ul>
  );
}
