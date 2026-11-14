"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type Transition,
  type Variants,
} from "framer-motion";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { EASE_IN, EASE_IN_OUT, EASE_OUT_EXPO } from "@/components/motion/easing";
import { INTRO_SEEN_KEY } from "@/components/motion/intro";
import {
  BLUE_LINES,
  BOTTOM_H,
  FRAME_W,
  GREEN_LINES,
  LIGHTEN,
  RED_LINE,
  TOP_H,
} from "@/components/TransitLines";

const LOGO = "/logos/gateways-logo.png";
const TRANSIT_ICON = "/transit/transit-icon.jpg";

// Seconds from when the assets are ready. The build-in is the interest quiz's loading screen,
// held longer after sign-in so the scene can settle before the logo flies into home.
const T = {
  red: 0.2,
  blue: [0.4, 0.55],
  green: [0.45, 0.6, 0.75],
  ping: 1.1,
  icon: 1.25,
  logo: 1.4,
  pulse: 1.7,
  exit: 3,
};
const EXIT_S = 0.9;

/** Green line centrelines in frame space; each starts off-screen right so the line arrives. */
const GREEN_PATHS = [
  "M415.75 5.3 L222.2 5.3 C164.4 5.3 109.2 -19.1 70.4 -62",
  "M415.7 48.5 L208.1 48.5 C146.3 48.5 87.6 21.5 47.3 -25.4 L40.7 -33",
  "M530.7 91.5 L378.2 91.5 C294 91.5 225.7 159.8 225.7 244 L225.7 327",
];

/** Positions HTML inside the bottom group, in the frame coordinates of `TransitBackdrop`. */
function place(x: number, y: number, w: number, h: number): CSSProperties {
  return {
    left: `${(x / FRAME_W) * 100}%`,
    top: `${(y / BOTTOM_H) * 100}%`,
    width: `${(w / FRAME_W) * 100}%`,
    height: `${(h / BOTTOM_H) * 100}%`,
  };
}

function preload(srcs: string[]) {
  return Promise.all(
    srcs.map((src) => {
      const img = document.createElement("img");
      img.src = src;
      return img.decode().catch(() => undefined);
    }),
  );
}

const subscribe = () => () => {};

function introSeen() {
  try {
    return (
      document.documentElement.hasAttribute("data-intro-seen") ||
      sessionStorage.getItem(INTRO_SEEN_KEY) !== null ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  } catch {
    return true;
  }
}

type Phase = "load" | "build" | "exit" | "done";

/**
 * The opening title sequence, once per session: the transit lines build in, the Gateways logo
 * is wiped on by a headlight, light pulses ride the lines, then the logo flies up into the home
 * header while the scene dissolves into the identical backdrop underneath.
 */
export function IntroSplash() {
  const seen = useSyncExternalStore(subscribe, introSeen, () => false);
  const [phase, setPhase] = useState<Phase>("load");
  if (seen || phase === "done") return null;
  return <Scene phase={phase} setPhase={setPhase} />;
}

function Scene({ phase, setPhase }: { phase: Phase; setPhase: (phase: Phase) => void }) {
  const reduceMotion = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const logoRef = useRef<HTMLDivElement>(null);
  const exiting = useRef(false);

  const logoProgress = useMotionValue(0);
  const logoClip = useTransform(logoProgress, (p) => `inset(-20% ${100 - p * 100}% -20% 0%)`);
  const glowLeft = useTransform(logoProgress, (p) => `${p * 100}%`);
  const glowOpacity = useTransform(logoProgress, [0, 0.08, 0.85, 1], [0, 1, 1, 0]);

  useEffect(() => {
    let cancelled = false;
    const assets = [...GREEN_LINES, ...BLUE_LINES, RED_LINE].map((line) => line.src);
    const fallback = new Promise((resolve) => setTimeout(resolve, 2500));
    Promise.race([preload([...assets, LOGO, TRANSIT_ICON]), fallback]).then(() => {
      if (!cancelled) setPhase("build");
    });
    return () => {
      cancelled = true;
    };
  }, [setPhase]);

  const exit = useCallback(() => {
    if (exiting.current) return;
    exiting.current = true;
    setPhase("exit");
    const finish = () => {
      try {
        sessionStorage.setItem(INTRO_SEEN_KEY, "1");
      } catch {
        // Without storage the intro simply plays again next visit.
      }
      setPhase("done");
    };

    const logo = logoRef.current;
    if (!logo) {
      finish();
      return;
    }
    // Lands on the home header's logo; on any other page it just dissolves with the scene.
    const target = document.querySelector<HTMLElement>("[data-intro-logo]");
    if (!target) {
      animate(logo, { opacity: 0 }, { duration: EXIT_S * 0.7, ease: "easeOut" }).then(finish);
      return;
    }
    const from = logo.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    animate(
      logo,
      { x: to.left - from.left, y: to.top - from.top, scale: to.width / from.width },
      { duration: EXIT_S, ease: EASE_IN_OUT },
    ).then(finish);
  }, [setPhase]);

  useEffect(() => {
    if (phase !== "build") return;
    const controls = animate(logoProgress, 1, { delay: T.logo, duration: 0.8, ease: EASE_IN_OUT });
    const timer = setTimeout(exit, T.exit * 1000);
    return () => {
      controls.stop();
      clearTimeout(timer);
    };
  }, [phase, logoProgress, exit]);

  const state = phase === "load" ? "hidden" : phase === "build" ? "show" : "leave";
  const tx = (transition: Transition): Transition => (reduceMotion ? { duration: 0 } : transition);
  const fadeOut: Transition = { duration: EXIT_S * 0.7, delay: EXIT_S * 0.15, ease: "easeOut" };

  const riseUp = (delay: number): Variants => ({
    hidden: { scaleY: 0 },
    show: { scaleY: 1, transition: tx({ delay, duration: 0.8, ease: EASE_OUT_EXPO }) },
    leave: { scaleY: 1 },
  });

  const wipeRight = (delay: number): Variants => ({
    hidden: { scaleX: 0 },
    show: { scaleX: 1, transition: tx({ delay, duration: 0.75, ease: EASE_IN_OUT }) },
    leave: { scaleX: 1 },
  });

  const ping = (delay: number): Variants => ({
    hidden: { scale: 1, opacity: 0 },
    show: {
      scale: [1, 1, 2.4],
      opacity: [0, 0.8, 0],
      transition: { delay, duration: 0.85, ease: "easeOut", times: [0, 0.06, 1] },
    },
    leave: { opacity: 0, transition: { duration: 0 } },
  });

  // A soft light that rides a line once it's built, masked to the line's own pixels.
  const pulse = (move: { x: number } | { y: number }, delay: number): Variants => ({
    hidden: { x: 0, y: 0, opacity: 0 },
    show: {
      ...move,
      opacity: [0, 1, 1, 0],
      transition: {
        delay,
        duration: 0.9,
        ease: "easeInOut",
        opacity: { delay, duration: 0.9, times: [0, 0.2, 0.75, 1] },
      },
    },
    leave: { opacity: 0, transition: { duration: 0.15 } },
  });

  return (
    <div
      className="intro-splash fixed inset-0 z-[60] cursor-pointer"
      data-holding={phase === "load" || phase === "build" ? "" : undefined}
      onClick={phase === "build" ? exit : undefined}
    >
      <p role="status" className="sr-only">
        Loading Gateways 2026
      </p>
      <motion.div
        className="absolute inset-0 bg-night"
        initial={false}
        animate={phase === "exit" ? { opacity: 0 } : { opacity: 1 }}
        transition={fadeOut}
      />

      <motion.div
        className="relative mx-auto h-full max-w-md overflow-hidden"
        initial="hidden"
        animate={state}
        variants={{
          hidden: { scale: 1.06 },
          show: { scale: 1, transition: tx({ duration: 2.2, ease: [0.22, 1, 0.36, 1] }) },
          leave: { scale: 1 },
        }}
      >
        {/* Top group: the green lines arrive from the right and curve off the top. */}
        <motion.svg
          aria-hidden
          viewBox={`0 0 ${FRAME_W} ${TOP_H}`}
          className="absolute inset-x-0 top-0 h-auto w-full"
          variants={{ leave: { opacity: 0, transition: fadeOut } }}
        >
          <defs>
            {/* Crushes the JPG's near-black background so only the line itself masks. */}
            <filter id={`${uid}-crush`} colorInterpolationFilters="sRGB">
              <feComponentTransfer>
                <feFuncR type="linear" slope={1.6} intercept={-0.12} />
                <feFuncG type="linear" slope={1.6} intercept={-0.12} />
                <feFuncB type="linear" slope={1.6} intercept={-0.12} />
              </feComponentTransfer>
            </filter>
            <filter id={`${uid}-soft`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={7} />
            </filter>
            {GREEN_LINES.map((line, i) => (
              <g key={line.src}>
                <mask id={`${uid}-draw-${i}`} maskUnits="userSpaceOnUse" x={-100} y={-100} width={700} height={500}>
                  <motion.path
                    d={GREEN_PATHS[i]}
                    fill="none"
                    stroke="white"
                    strokeWidth={42}
                    variants={{
                      hidden: { pathLength: 0 },
                      show: {
                        pathLength: 1,
                        transition: tx({ delay: T.green[i], duration: 0.9, ease: [0.45, 0, 0.2, 1] }),
                      },
                      leave: { pathLength: 1 },
                    }}
                  />
                </mask>
                <mask id={`${uid}-lum-${i}`} maskUnits="userSpaceOnUse" x={-100} y={-100} width={700} height={500}>
                  <image
                    href={line.src}
                    x={line.x}
                    y={line.y}
                    width={line.w}
                    height={line.h}
                    preserveAspectRatio="none"
                    filter={`url(#${uid}-crush)`}
                  />
                </mask>
              </g>
            ))}
          </defs>

          {GREEN_LINES.map((line, i) => (
            <g key={line.src}>
              <image
                href={line.src}
                x={line.x}
                y={line.y}
                width={line.w}
                height={line.h}
                preserveAspectRatio="none"
                mask={`url(#${uid}-draw-${i})`}
                style={LIGHTEN}
              />
              <g mask={`url(#${uid}-lum-${i})`}>
                <motion.path
                  d={GREEN_PATHS[i]}
                  fill="none"
                  stroke="#dcffe2"
                  strokeWidth={60}
                  filter={`url(#${uid}-soft)`}
                  variants={{
                    hidden: { pathLength: 0.14, pathOffset: 0, opacity: 0 },
                    show: reduceMotion
                      ? { opacity: 0 }
                      : {
                          pathOffset: 1,
                          opacity: [0, 1, 1, 0],
                          transition: {
                            delay: T.pulse + i * 0.08,
                            duration: 0.85,
                            ease: "easeInOut",
                            opacity: { delay: T.pulse + i * 0.08, duration: 0.85, times: [0, 0.2, 0.75, 1] },
                          },
                        },
                    leave: { opacity: 0, transition: { duration: 0.15 } },
                  }}
                />
              </g>
            </g>
          ))}
        </motion.svg>

        {/* Bottom group: the M and A blue lines rise into the red line, pinned to the bottom edge. */}
        <div className="absolute inset-x-0 bottom-0 w-full" style={{ aspectRatio: `${FRAME_W} / ${BOTTOM_H}` }}>
          <motion.svg
            aria-hidden
            viewBox={`0 0 ${FRAME_W} ${BOTTOM_H}`}
            className="absolute inset-0 size-full"
            variants={{ leave: { opacity: 0, transition: fadeOut } }}
          >
            <defs>
              <filter id={`${uid}-crush-b`} colorInterpolationFilters="sRGB">
                <feComponentTransfer>
                  <feFuncR type="linear" slope={1.6} intercept={-0.12} />
                  <feFuncG type="linear" slope={1.6} intercept={-0.12} />
                  <feFuncB type="linear" slope={1.6} intercept={-0.12} />
                </feComponentTransfer>
              </filter>
              <linearGradient id={`${uid}-glint-x`}>
                <stop offset="0" stopColor="#fff" stopOpacity="0" />
                <stop offset="0.5" stopColor="#fff" stopOpacity="0.85" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id={`${uid}-glint-y`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fff" stopOpacity="0" />
                <stop offset="0.5" stopColor="#fff" stopOpacity="0.85" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
              {BLUE_LINES.map((line, i) => (
                <mask key={line.src} id={`${uid}-rise-${i}`} maskUnits="userSpaceOnUse">
                  <motion.rect
                    x={line.x}
                    y={line.y}
                    width={line.w}
                    height={line.h}
                    fill="white"
                    style={{ originY: 1 }}
                    variants={riseUp(T.blue[i])}
                  />
                </mask>
              ))}
              <mask id={`${uid}-wipe`} maskUnits="userSpaceOnUse">
                <motion.rect
                  x={RED_LINE.x}
                  y={RED_LINE.y}
                  width={RED_LINE.w}
                  height={RED_LINE.h}
                  fill="white"
                  style={{ originX: 0 }}
                  variants={wipeRight(T.red)}
                />
              </mask>
              {[...BLUE_LINES, RED_LINE].map((line, i) => (
                <mask key={line.src} id={`${uid}-lum-b-${i}`} maskUnits="userSpaceOnUse">
                  <image
                    href={line.src}
                    x={line.x}
                    y={line.y}
                    width={line.w}
                    height={line.h}
                    preserveAspectRatio="none"
                    filter={`url(#${uid}-crush-b)`}
                  />
                </mask>
              ))}
            </defs>

            {BLUE_LINES.map((line, i) => (
              <image
                key={line.src}
                href={line.src}
                x={line.x}
                y={line.y}
                width={line.w}
                height={line.h}
                preserveAspectRatio="none"
                mask={`url(#${uid}-rise-${i})`}
                style={LIGHTEN}
              />
            ))}
            <image
              href={RED_LINE.src}
              x={RED_LINE.x}
              y={RED_LINE.y}
              width={RED_LINE.w}
              height={RED_LINE.h}
              preserveAspectRatio="none"
              mask={`url(#${uid}-wipe)`}
              style={LIGHTEN}
            />

            {!reduceMotion && (
              <>
                {/* Trains: light running up each blue line, then along the red line. */}
                {BLUE_LINES.map((line, i) => (
                  <g key={line.src} mask={`url(#${uid}-lum-b-${i})`}>
                    <motion.rect
                      x={line.x}
                      y={line.h}
                      width={line.w}
                      height={140}
                      fill={`url(#${uid}-glint-y)`}
                      variants={pulse({ y: -(line.h + 140) }, T.pulse + 0.1 + i * 0.1)}
                    />
                  </g>
                ))}
                <g mask={`url(#${uid}-lum-b-${BLUE_LINES.length})`}>
                  <motion.rect
                    x={-160}
                    y={RED_LINE.y}
                    width={160}
                    height={RED_LINE.h}
                    fill={`url(#${uid}-glint-x)`}
                    variants={pulse({ x: RED_LINE.w + 160 }, T.pulse + 0.05)}
                  />
                </g>
              </>
            )}
          </motion.svg>

          {[43, 85].map((x, i) => (
            <motion.span
              key={x}
              aria-hidden
              className="absolute rounded-full border-[1.5px] border-white/70"
              style={place(x, 332, 26, 26)}
              variants={reduceMotion ? {} : ping(T.ping + i * 0.12)}
            />
          ))}

          <motion.div
            aria-hidden
            className="absolute"
            style={{ ...place(124, 330, 34, 34), ...LIGHTEN }}
            variants={{
              hidden: { scale: 0, rotate: -25, opacity: 0 },
              show: {
                scale: 1,
                rotate: 0,
                opacity: 1,
                transition: tx({ delay: T.icon, type: "spring", stiffness: 420, damping: 16 }),
              },
              leave: { scale: 0, rotate: 30, opacity: 0, transition: tx({ duration: 0.3, ease: EASE_IN }) },
            }}
          >
            <Image src={TRANSIT_ICON} alt="" fill sizes="34px" unoptimized />
          </motion.div>

          <motion.div
            className="absolute"
            style={place(52, 59, 298, 63)}
            variants={{
              hidden: { y: 8 },
              show: { y: 0, transition: tx({ delay: T.logo, duration: 0.9, ease: EASE_OUT_EXPO }) },
              leave: { y: 0 },
            }}
          >
            <div ref={logoRef} className="absolute inset-0 origin-top-left">
              <motion.div className="absolute inset-0" style={{ clipPath: reduceMotion ? undefined : logoClip }}>
                <Image src={LOGO} alt="Gateways" fill sizes="300px" priority />
              </motion.div>
              {/* A headlight riding the moving edge of the logo wipe. */}
              {!reduceMotion && (
                <motion.span
                  aria-hidden
                  className="absolute -bottom-[15%] -top-[15%] w-[7%] -translate-x-1/2 blur-[3px]"
                  style={{
                    left: glowLeft,
                    opacity: glowOpacity,
                    background: "linear-gradient(90deg, transparent, rgb(255 255 255 / 0.95) 50%, transparent)",
                  }}
                />
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
