import Link from "next/link";

type HomePanelProps = {
  href: string;
  title: string;
  description: string;
};

export function HomePanel({ href, title, description }: HomePanelProps) {
  return (
    <Link
      href={href}
      className="flex flex-1 flex-col justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-5 transition-colors hover:bg-zinc-100 active:bg-zinc-200"
    >
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-zinc-600">{description}</p>
      </div>
      <span className="self-end text-sm font-medium text-zinc-900">
        Open →
      </span>
    </Link>
  );
}
