import { ArrowUpRight } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { TransitionLink, type PageTransition } from "@/components/motion/PageTransitions";

type HomePanelProps = {
  href: string;
  title: string;
  action: string;
  /** Decorative layer behind the text, usually a `PanelBackground`. */
  background?: ReactNode;
  /** Blur and darken the background behind the text and button; `soft` only takes the edge off. */
  scrim?: "strong" | "soft";
  /** Wrap the title early to keep it clear of artwork on the right. */
  narrowTitle?: boolean;
  /** Opens outside the app, in a new tab. */
  external?: boolean;
  /** Animation that covers the screen while the destination loads. */
  transition?: PageTransition;
  /** The tall lead panel. */
  featured?: boolean;
  /** Position in the list, used to stagger the entrance. */
  index: number;
};

/** Decorative layer that fills a panel behind its text. */
export function PanelBackground({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 overflow-hidden bg-night">
      {children}
    </div>
  );
}

export function HomePanel({
  href,
  title,
  action,
  background,
  scrim,
  narrowTitle,
  external,
  transition,
  featured,
  index,
}: HomePanelProps) {
  const linkClassName =
    "panel-link absolute inset-0 flex flex-col justify-end px-6 pb-7 focus-visible:outline-none";

  const content = (
    <div className="relative flex flex-col">
      {scrim && (
        <span
          aria-hidden
          className={`panel-scrim absolute -inset-x-6 -bottom-7 -top-20 -z-10 ${scrim === "soft" ? "panel-scrim-soft" : ""}`}
        />
      )}
      <h2
        className={`${narrowTitle ? "max-w-[200px]" : "max-w-[321px]"} text-[30px] font-bold leading-[30px] tracking-[-0.04em] text-balance`}
      >
        {title}
      </h2>
      <span className="mt-4 inline-flex bg-white text-night h-[25px] items-center gap-0.5 self-start rounded-full px-3 text-[15px] font-medium tracking-[-0.04em]">
        {action}
        {external && <ArrowUpRight aria-hidden className="-mr-1 size-3.5" />}
      </span>
    </div>
  );

  return (
    <div className="scroll-zoom">
      <div
        className={`metal-panel ${featured ? "h-[458px]" : "h-[188px]"}`}
        style={{ "--delay": `${120 + index * 90}ms` } as CSSProperties}
      >
        {background}
        {external ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
            {content}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : (
          <TransitionLink href={href} transition={transition} className={linkClassName}>
            {content}
          </TransitionLink>
        )}
      </div>
    </div>
  );
}
