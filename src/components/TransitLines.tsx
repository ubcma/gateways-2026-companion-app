import type { CSSProperties } from "react";

// Positions are in the 402×874 Figma "Home" frame (137:287), shared with the interest quiz.
export const FRAME_W = 402;
/** The top group (green lines) is pinned to the top edge… */
export const TOP_H = 330;
/** …and the bottom group (blue and red lines) to the bottom edge. */
export const BOTTOM_H = 528;

export const GREEN_LINES = [
  { src: "/transit/green-line-3.jpg", x: 55.75, y: 0, w: 346.25, h: 25 },
  { src: "/transit/green-line-2.jpg", x: 25.75, y: 0, w: 376.25, h: 68.25 },
  { src: "/transit/green-line-1.jpg", x: 206.25, y: 72, w: 195.75, h: 255 },
];

export const BLUE_LINES = [
  { src: "/transit/blue-line-1.jpg", x: 35, y: 0, w: 41, h: 486 },
  { src: "/transit/blue-line-2.jpg", x: 77, y: 0, w: 41, h: 486 },
];

export const RED_LINE = { src: "/transit/red-line.jpg", x: 0, y: 487, w: 402, h: 41 };

const STATION_LINES = [...BLUE_LINES, RED_LINE];

// The JPGs are flattened onto the night background; `lighten` drops it wherever lines overlap.
export const LIGHTEN: CSSProperties = { mixBlendMode: "lighten" };

type Line = (typeof GREEN_LINES)[number];

function LineImages({ lines }: { lines: Line[] }) {
  return lines.map((line) => (
    <image
      key={line.src}
      href={line.src}
      x={line.x}
      y={line.y}
      width={line.w}
      height={line.h}
      preserveAspectRatio="none"
      style={LIGHTEN}
    />
  ));
}

/**
 * The interest quiz's transit lines as a screen-sized backdrop that stays put while the page
 * scrolls: green lines arriving along the top, the M and A blue lines running into the red line.
 */
export function TransitBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 mx-auto max-w-md overflow-hidden animate-[fade-in_1.2s_ease-out]"
    >
      <svg viewBox={`0 0 ${FRAME_W} ${TOP_H}`} className="absolute inset-x-0 top-0 h-auto w-full">
        <LineImages lines={GREEN_LINES} />
      </svg>
      <svg viewBox={`0 0 ${FRAME_W} ${BOTTOM_H}`} className="absolute inset-x-0 bottom-0 h-auto w-full">
        <LineImages lines={STATION_LINES} />
      </svg>
    </div>
  );
}
