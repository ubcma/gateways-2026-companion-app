"use client";

import { MotionConfig, motion, useReducedMotion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { EASE_IN, EASE_OUT_EXPO, SWEEP_EASE } from "@/components/motion/easing";
import { LINES, type Line } from "@/lib/gateways-line/config";
import { LINE_STYLE } from "@/lib/gateways-line/style";

/**
 * board: the attendee's line sweeps up over the screen with a "Now boarding" announcement.
 * doors: train doors slide shut, announce the next stop, then open onto the new page.
 */
export type PageTransition = { kind: "board" } | { kind: "doors"; stop: string };

type Phase = "cover" | "wait" | "reveal";

type Active = {
  href: string;
  transition: PageTransition;
  line: Line;
  /** The screen is covered and navigation has started. */
  covered: boolean;
  /** The announcement has been up long enough to read. */
  held: boolean;
  /** The navigation never landed; reveal whatever is there. */
  gaveUp: boolean;
};

type TransitionApi = {
  navigate: (href: string, transition: PageTransition) => void;
  rememberLine: (line: Line) => void;
};

const TransitionContext = createContext<TransitionApi | null>(null);
const RevealedContext = createContext(true);

/** Long enough to read the announcement, even when the page is already cached. */
const MIN_HOLD_MS: Record<PageTransition["kind"], number> = { board: 650, doors: 450 };
/** Reveal whatever is underneath if the navigation never lands (e.g. a redirect). */
const GIVE_UP_MS = 5000;

export function PageTransitions({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<Active | null>(null);
  const line = useRef<Line>("General");

  const navigate = useCallback(
    (href: string, transition: PageTransition) => {
      if (reduceMotion) {
        router.push(href);
        return;
      }
      router.prefetch(href);
      setActive({ href, transition, line: line.current, covered: false, held: false, gaveUp: false });
    },
    [reduceMotion, router],
  );

  const rememberLine = useCallback((value: Line) => {
    line.current = value;
  }, []);

  const api = useMemo(() => ({ navigate, rememberLine }), [navigate, rememberLine]);

  const covered = active?.covered ?? false;
  const kind = active?.transition.kind;
  useEffect(() => {
    if (!covered || !kind) return;
    const hold = setTimeout(() => setActive((a) => a && { ...a, held: true }), MIN_HOLD_MS[kind]);
    const giveUp = setTimeout(() => setActive((a) => a && { ...a, gaveUp: true }), GIVE_UP_MS);
    return () => {
      clearTimeout(hold);
      clearTimeout(giveUp);
    };
  }, [covered, kind]);

  let phase: Phase = "cover";
  if (active?.covered) {
    const arrived = pathname === active.href && active.held;
    phase = arrived || active.gaveUp ? "reveal" : "wait";
  }

  const onCovered = () => {
    if (!active) return;
    router.push(active.href);
    setActive({ ...active, covered: true });
  };
  const onDone = () => setActive(null);

  return (
    <MotionConfig reducedMotion="user">
      <TransitionContext value={api}>
        <RevealedContext value={!active || phase === "reveal"}>
          {children}
          {active && (
            <div
              aria-hidden
              className="page-transition fixed inset-0 z-50 overflow-hidden"
              data-covering={phase === "reveal" ? undefined : ""}
            >
              {active.transition.kind === "board" ? (
                <BoardOverlay line={active.line} phase={phase} onCovered={onCovered} onDone={onDone} />
              ) : (
                <DoorsOverlay
                  stop={active.transition.stop}
                  phase={phase}
                  onCovered={onCovered}
                  onDone={onDone}
                />
              )}
            </div>
          )}
        </RevealedContext>
      </TransitionContext>
    </MotionConfig>
  );
}

/** False while a page transition still covers the screen; entrances wait for it. */
export function usePageRevealed() {
  return use(RevealedContext);
}

/** A `next/link` that plays a page transition on a plain click. */
export function TransitionLink({
  href,
  transition,
  onClick,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & { href: string; transition?: PageTransition }) {
  const api = use(TransitionContext);
  return (
    <Link
      href={href}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
        if (!transition || !api || event.defaultPrevented || event.button !== 0 || modified) return;
        event.preventDefault();
        api.navigate(href, transition);
      }}
    />
  );
}

/** Lets the boarding transition announce the attendee's line once the home page knows it. */
export function RememberLine({ line }: { line: Line }) {
  const api = use(TransitionContext);
  useEffect(() => api?.rememberLine(line), [api, line]);
  return null;
}

type OverlayProps = { phase: Phase; onCovered: () => void; onDone: () => void };

const BOARD = { rise: 0.5, stagger: 0.06, exit: 0.5 };

function BoardOverlay({ line, phase, onCovered, onDone }: OverlayProps & { line: Line }) {
  // The attendee's line sweeps in last, so it's the one that covers the screen.
  const order = [...LINES.filter((other) => other !== line), line];
  const last = order.length - 1;

  return order.map((id, i) => (
    <motion.div
      key={id}
      className="absolute inset-0 overflow-hidden"
      style={{ background: LINE_STYLE[id].sweep }}
      initial="hidden"
      animate={phase === "reveal" ? "gone" : "cover"}
      variants={{
        hidden: { clipPath: "inset(100% 0% 0% 0%)" },
        cover: {
          clipPath: "inset(0% 0% 0% 0%)",
          transition: { delay: i * BOARD.stagger, duration: BOARD.rise, ease: SWEEP_EASE },
        },
        // Carries on upward, so the new page is uncovered from the bottom.
        gone: {
          clipPath: "inset(0% 0% 100% 0%)",
          transition: { delay: (last - i) * BOARD.stagger, duration: BOARD.exit, ease: SWEEP_EASE },
        },
      }}
      onAnimationComplete={(definition) => {
        if (i === last && definition === "cover") onCovered();
        if (i === 0 && definition === "gone") onDone();
      }}
    >
      {i === last && <Announcement line={id} delay={last * BOARD.stagger + BOARD.rise * 0.45} />}
    </motion.div>
  ));
}

function Announcement({ line, delay }: { line: Line; delay: number }) {
  const { name, onColor } = LINE_STYLE[line];
  const drift = (distance: number, stagger: number): Variants => ({
    hidden: { x: -distance, opacity: 0 },
    cover: {
      x: 0,
      opacity: 1,
      transition: { delay: delay + stagger, duration: 0.7, ease: EASE_OUT_EXPO },
    },
    gone: { x: distance * 0.6, opacity: 0, transition: { duration: 0.35, ease: EASE_IN } },
  });

  return (
    <div
      className="relative mx-auto flex h-full max-w-md flex-col justify-center px-9 font-display"
      style={{ color: onColor }}
    >
      <motion.p
        variants={drift(64, 0)}
        className="flex items-center gap-2.5 text-[15px] font-bold uppercase tracking-[0.12em]"
      >
        <Image
          src="/transit/transit-icon.jpg"
          alt=""
          width={22}
          height={22}
          unoptimized
          className="rounded-[4px]"
        />
        Now boarding
      </motion.p>
      <motion.p
        variants={drift(96, 0.05)}
        className="mt-2 text-[50px] font-bold leading-[47px] tracking-[-0.04em]"
      >
        {name}
      </motion.p>
      <motion.p
        variants={drift(120, 0.1)}
        className="mt-3 text-[15px] font-medium tracking-[-0.02em] opacity-80"
      >
        First stop: Station 1 · Check-in
      </motion.p>
    </div>
  );
}

const DOOR_BACKGROUND =
  "linear-gradient(180deg, #26262a, #161618 38%, #0e0e0e), repeating-linear-gradient(90deg, rgb(255 255 255 / 0.02) 0 1px, transparent 1px 6px)";
const WINDOW_BACKGROUND =
  "linear-gradient(125deg, rgb(255 255 255 / 0.14), rgb(255 255 255 / 0.03) 38%, transparent 39%, rgb(255 255 255 / 0.05) 62%, rgb(255 255 255 / 0.02))";

function DoorsOverlay({ stop, phase, onCovered, onDone }: OverlayProps & { stop: string }) {
  const door = (away: string): Variants => ({
    hidden: { x: away },
    cover: { x: "0%", transition: { duration: 0.55, ease: SWEEP_EASE } },
    gone: { x: away, transition: { delay: 0.15, duration: 0.6, ease: SWEEP_EASE } },
  });

  return (
    <motion.div
      className="relative mx-auto h-full max-w-md overflow-hidden"
      initial="hidden"
      animate={phase === "reveal" ? "gone" : "cover"}
    >
      {(["left", "right"] as const).map((side) => (
        <motion.div
          key={side}
          variants={door(side === "left" ? "-101%" : "101%")}
          className={`absolute inset-y-0 w-1/2 overflow-hidden ${side === "left" ? "left-0" : "right-0"}`}
          style={{ background: DOOR_BACKGROUND }}
          onAnimationComplete={(definition) => {
            if (side !== "left") return;
            if (definition === "cover") onCovered();
            if (definition === "gone") onDone();
          }}
        >
          <div
            className={`absolute top-[13%] h-[34%] w-[64%] rounded-[26px] border border-white/10 ${side === "left" ? "right-[13%]" : "left-[13%]"}`}
            style={{ background: WINDOW_BACKGROUND }}
          />
          {/* The red line as the train's livery, continuous across both doors. */}
          <div
            className="absolute inset-x-0 top-[66%] h-[22px]"
            style={{
              backgroundImage: "url(/transit/red-line.jpg)",
              backgroundSize: "200% 100%",
              backgroundPosition: side === "left" ? "left center" : "right center",
            }}
          />
          <div className={`absolute inset-y-0 w-[3px] bg-black ${side === "left" ? "right-0" : "left-0"}`} />
        </motion.div>
      ))}

      {/* Red while the doors are shut, green as they open. */}
      <motion.span
        className="absolute left-1/2 top-[max(28px,env(safe-area-inset-top))] size-2.5 -translate-x-1/2 rounded-full"
        variants={{
          hidden: { opacity: 0, backgroundColor: "#de4d3f", boxShadow: "0 0 12px 2px rgb(222 77 63 / 0.7)" },
          cover: { opacity: 1, transition: { delay: 0.45, duration: 0.2 } },
          gone: {
            backgroundColor: "#459b50",
            boxShadow: "0 0 12px 2px rgb(69 155 80 / 0.7)",
            opacity: [1, 1, 0],
            transition: { duration: 0.6, times: [0, 0.6, 1] },
          },
        }}
      />

      <motion.div
        className="absolute inset-x-0 top-[52%] flex justify-center"
        variants={{
          hidden: { opacity: 0, y: 10 },
          cover: { opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.45, ease: EASE_OUT_EXPO } },
          gone: { opacity: 0, transition: { duration: 0.15 } },
        }}
      >
        <p className="rounded-full bg-night/90 px-4 py-2 font-display text-[13px] font-bold uppercase tracking-[0.12em] text-white ring-1 ring-white/15">
          Next stop · {stop}
        </p>
      </motion.div>
    </motion.div>
  );
}
