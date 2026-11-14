import Image from "next/image";
import Link from "next/link";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
};

export function AppHeader({ title, subtitle, backHref }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-night/85 pb-3 pl-[10px] pr-5 pt-[max(29px,env(safe-area-inset-top))] font-display text-white backdrop-blur">
      <div className="flex items-center">
        {backHref && (
          <Link href={backHref} aria-label="Back" className="p-3">
            <Image src="/gateways-route/back.svg" alt="" width={10} height={16} />
          </Link>
        )}
        <h1 className="text-[22px] font-bold tracking-[-0.04em]">{title}</h1>
      </div>
      {subtitle && <p className="pl-[10px] text-sm text-zinc-400">{subtitle}</p>}
    </header>
  );
}
