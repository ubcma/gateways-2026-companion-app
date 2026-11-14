"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { EASE_IN_OUT, EASE_OUT_EXPO } from "@/components/motion/easing";
import { LINES } from "@/lib/gateways-line/config";
import { LINE_STYLE } from "@/lib/gateways-line/style";

const CYCLE = 2.8;
const LIGHTEN = { mixBlendMode: "lighten" as const };

/**
 * A looping micro-scene of the Gateways transit system: green lines arrive, blue pillars rise,
 * the red line wipes across, and the transit icon rides the track as a train.
 */
export function TransitLoader({ label = "Loading" }: { label?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div role="status" className="flex flex-col items-center gap-6 font-display">
      <div aria-hidden className="relative h-[132px] w-[220px] overflow-hidden rounded-2xl bg-night">
        {/* Green lines: arrive from the right, then breathe. */}
        <motion.div
          className="absolute -right-2 top-2 h-[18px] w-[170px]"
          style={LIGHTEN}
          initial={reduceMotion ? false : { x: 80, opacity: 0 }}
          animate={reduceMotion ? undefined : { x: [80, 0, 0, 8, 0], opacity: [0, 1, 1, 1, 1] }}
          transition={{ duration: CYCLE, times: [0, 0.18, 0.55, 0.78, 1], ease: EASE_OUT_EXPO, repeat: Infinity }}
        >
          <Image src="/transit/green-line-3.jpg" alt="" fill unoptimized className="object-cover" />
        </motion.div>
        <motion.div
          className="absolute -right-4 top-5 h-[28px] w-[190px]"
          style={LIGHTEN}
          initial={reduceMotion ? false : { x: 100, opacity: 0 }}
          animate={reduceMotion ? undefined : { x: [100, 0, 0, 10, 0], opacity: [0, 1, 1, 1, 1] }}
          transition={{
            duration: CYCLE,
            delay: 0.08,
            times: [0, 0.2, 0.55, 0.78, 1],
            ease: EASE_OUT_EXPO,
            repeat: Infinity,
          }}
        >
          <Image src="/transit/green-line-2.jpg" alt="" fill unoptimized className="object-cover" />
        </motion.div>

        {/* Blue M/A pillars rise into the red line. */}
        {[35, 72].map((left, i) => (
          <motion.div
            key={left}
            className="absolute bottom-[34px] w-[22px] origin-bottom"
            style={{ left, height: 72, ...LIGHTEN }}
            initial={reduceMotion ? false : { scaleY: 0 }}
            animate={reduceMotion ? undefined : { scaleY: [0, 1, 1, 1, 0] }}
            transition={{
              duration: CYCLE,
              delay: 0.12 + i * 0.08,
              times: [0, 0.22, 0.7, 0.85, 1],
              ease: EASE_OUT_EXPO,
              repeat: Infinity,
            }}
          >
            <Image
              src={i === 0 ? "/transit/blue-line-1.jpg" : "/transit/blue-line-2.jpg"}
              alt=""
              fill
              unoptimized
              className="object-cover"
            />
          </motion.div>
        ))}

        {/* Red line wipes left → right, then holds. */}
        <div className="absolute inset-x-0 bottom-5 h-[22px] overflow-hidden">
          <motion.div
            className="absolute inset-0 origin-left"
            style={LIGHTEN}
            initial={reduceMotion ? false : { scaleX: 0 }}
            animate={reduceMotion ? undefined : { scaleX: [0, 1, 1, 1, 0] }}
            transition={{
              duration: CYCLE,
              delay: 0.05,
              times: [0, 0.2, 0.72, 0.88, 1],
              ease: EASE_IN_OUT,
              repeat: Infinity,
            }}
          >
            <Image src="/transit/red-line.jpg" alt="" fill unoptimized className="object-cover" />
          </motion.div>
        </div>

        {/* Coloured station dots along the red line, lighting as the train passes. */}
        {LINES.map((line, i) => {
          const arrive = 0.22 + i * 0.14;
          const color = LINE_STYLE[line].color;
          return (
            <motion.span
              key={line}
              className="absolute bottom-[26px] size-2.5 -translate-x-1/2 rounded-full"
              style={{ left: `${18 + i * 28}%`, backgroundColor: color }}
              animate={
                reduceMotion
                  ? undefined
                  : {
                      scale: [0.6, 0.6, 1.35, 1, 1, 0.6],
                      opacity: [0.25, 0.25, 1, 1, 1, 0.25],
                      boxShadow: [
                        `0 0 0 0 ${color}00`,
                        `0 0 0 0 ${color}00`,
                        `0 0 10px 2px ${color}aa`,
                        `0 0 6px 1px ${color}66`,
                        `0 0 6px 1px ${color}66`,
                        `0 0 0 0 ${color}00`,
                      ],
                    }
              }
              transition={{
                duration: CYCLE,
                times: [0, arrive - 0.02, arrive, arrive + 0.08, 0.85, 1],
                repeat: Infinity,
              }}
            />
          );
        })}

        {/* The transit icon rides the red line like a train. */}
        <motion.div
          className="absolute bottom-[18px] size-7 -translate-x-1/2 overflow-hidden rounded-[6px] shadow-[0_0_16px_4px_rgb(255_255_255/0.25)]"
          style={LIGHTEN}
          animate={
            reduceMotion
              ? { left: "50%" }
              : {
                  left: ["8%", "8%", "32%", "55%", "78%", "92%", "92%", "8%"],
                  rotate: [0, 0, 0, 0, 0, 0, 12, 0],
                  scale: [0.85, 1, 1, 1, 1, 1, 0.9, 0.85],
                }
          }
          transition={{
            duration: CYCLE,
            times: [0, 0.18, 0.32, 0.46, 0.6, 0.72, 0.88, 1],
            ease: "easeInOut",
            repeat: Infinity,
          }}
        >
          <Image src="/transit/transit-icon.jpg" alt="" fill unoptimized className="object-cover" />
        </motion.div>

        {/* Soft headlight ahead of the train. */}
        {!reduceMotion && (
          <motion.span
            className="absolute bottom-[22px] h-3 w-10 -translate-x-1/2 rounded-full bg-white/40 blur-[6px]"
            animate={{
              left: ["14%", "14%", "38%", "61%", "84%", "96%", "96%", "14%"],
              opacity: [0, 0.7, 0.9, 0.9, 0.9, 0.4, 0, 0],
            }}
            transition={{
              duration: CYCLE,
              times: [0, 0.18, 0.32, 0.46, 0.6, 0.72, 0.88, 1],
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
        )}
      </div>

      <p className="text-[15px] font-medium tracking-[-0.04em] text-zinc-300">
        {label}
        <motion.span
          aria-hidden
          animate={reduceMotion ? undefined : { opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          …
        </motion.span>
      </p>
    </div>
  );
}
