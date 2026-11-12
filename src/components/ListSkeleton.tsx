export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="h-24 animate-pulse rounded-xl bg-zinc-100" />
      ))}
    </ul>
  );
}
