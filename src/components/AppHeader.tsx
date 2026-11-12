import Link from "next/link";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
};

export function AppHeader({ title, subtitle, backHref }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur">
      {backHref && (
        <Link
          href={backHref}
          className="mb-1 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
        >
          <span aria-hidden>←</span> Back
        </Link>
      )}
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
    </header>
  );
}
