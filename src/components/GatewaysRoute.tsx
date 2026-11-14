import Image from "next/image";
import { UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { Enter } from "@/components/motion/Enter";
import { delegatePhoto } from "@/lib/delegate-photo";
import type { DelegateMatch } from "@/lib/delegate-matching/runtime";
import type { WorkshopPick } from "@/lib/gateways-line/assign-line";
import { LINES, type Line } from "@/lib/gateways-line/config";
import { formatTime } from "@/lib/format";

const LINE_IMAGES: Record<Line, string> = {
  General: "/gateways-route/line-general.svg",
  Brand: "/gateways-route/line-brand.svg",
  Creative: "/gateways-route/line-creative.svg",
  Product: "/gateways-route/line-product.svg",
};

const SCHEDULE = {
  checkIn: "09:30",
  workshop1: "10:25",
  workshop2: "11:45",
  lunch: "12:50",
  keynote: "14:00",
};

/** Splits "Host: Topic" so the host can be the headline. */
function splitWorkshopTitle(title: string) {
  const separator = title.indexOf(":");
  if (separator === -1) {
    return { host: title.trim(), topic: undefined };
  }
  return {
    host: title.slice(0, separator).trim(),
    topic: title.slice(separator + 1).trim() || undefined,
  };
}

function RouteLine({ line }: { line: Line }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-[-223px] top-[-20px] flex size-[1018.387px] items-center justify-center"
    >
      <div className="flex-none rotate-135 -scale-y-100">
        <div className="relative h-[849.428px] w-[590.789px]">
          <div className="absolute inset-[-1.71%_7.22%_-1.71%_-2.45%]">
            <Image src={LINE_IMAGES[line]} alt="" fill priority />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Stations appear in order as the line is drawn down past them. */
const stationDelay = (number: number) => 0.2 + number * 0.11;

function Station({
  number,
  top,
  children,
}: {
  number: number;
  top: number;
  children: ReactNode;
}) {
  return (
    <Enter as="li" delay={stationDelay(number)} className="absolute inset-x-0 flex items-start" style={{ top }}>
      <span className="ml-[85px] w-[96px] shrink-0 pt-[7px] text-[18px] font-bold leading-[17px] text-[#bcbcbc]">
        Station {number}
      </span>
      <Image
        src="/gateways-route/station-dot.svg"
        alt=""
        width={28}
        height={28}
        className="shrink-0"
      />
      <div className="-mt-px ml-[18px] min-w-0 flex-1 pr-4 text-[18px] font-medium leading-[17px] text-white">
        {children}
      </div>
    </Enter>
  );
}

function WorkshopStop({ slot, title }: { slot: 1 | 2; title: WorkshopPick }) {
  const time = formatTime(slot === 1 ? SCHEDULE.workshop1 : SCHEDULE.workshop2);
  if (!title?.trim()) {
    return (
      <>
        <p>{time}</p>
        <p>Workshop {slot}</p>
        <p className="mt-1 text-[12px] leading-[14px] text-[#bcbcbc]">Not picked yet</p>
      </>
    );
  }

  const { host, topic } = splitWorkshopTitle(title);
  return (
    <>
      <p>{time}</p>
      <p className="line-clamp-2">{host}</p>
      {topic && <p className="mt-1 line-clamp-3 text-[12px] leading-[14px]">{topic}</p>}
    </>
  );
}

function DelegateStation({ delegate }: { delegate: DelegateMatch | undefined }) {
  return (
    <Enter as="li" delay={stationDelay(6)} className="absolute inset-x-0 top-[671px] flex items-start">
      <span className="ml-[85px] w-[85px] shrink-0 pt-[25px] text-[18px] font-bold leading-[17px] text-[#bcbcbc]">
        Station 6
      </span>
      <Enter
        variant="pop"
        delay={stationDelay(6) + 0.15}
        className="flex size-[57px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-700 ring-[3px] ring-[#0e0e0e]"
      >
        {delegate ? (
          <Image
            src={delegatePhoto(delegate.delegateId)}
            alt=""
            width={57}
            height={57}
            className="size-full object-cover"
          />
        ) : (
          <UserRound aria-hidden className="size-7 text-zinc-300" />
        )}
      </Enter>
      <div className="ml-[13px] min-w-0 flex-1 pr-4 font-medium text-white">
        <p className="text-[8px] italic leading-[19px]">Network with your delegate:</p>
        {delegate ? (
          <>
            <p className="mt-[1.5px] truncate text-[19px] leading-[19px]">{delegate.name}</p>
            <p className="line-clamp-2 text-[12px] leading-[14px]">
              {delegate.role} · {delegate.company}
            </p>
          </>
        ) : (
          <>
            <p className="mt-[1.5px] text-[19px] leading-[14px]">Coming soon</p>
            <p className="text-[12px] leading-[14px]">Your match is on its way</p>
          </>
        )}
      </div>
    </Enter>
  );
}

type GatewaysRouteProps = {
  line: Line;
  workshops: [WorkshopPick, WorkshopPick];
  /** The attendee's top-ranked delegate match, if any. */
  delegate?: DelegateMatch;
  scores?: Record<Line, number>;
};

export function GatewaysRoute({ line, workshops, delegate, scores }: GatewaysRouteProps) {
  return (
    <div data-line={line} className="absolute inset-0 tracking-[-0.04em]">
      <Enter variant="draw" duration={1.3} className="absolute inset-0">
        <RouteLine line={line} />
      </Enter>

      <ol>
        <Station number={1} top={67}>
          <p>{formatTime(SCHEDULE.checkIn)}</p>
          <p>Check-in</p>
          <div className="relative mt-[5px] size-[23px] bg-[#183fa9]">
            <Image
              src="/gateways-route/transit.png"
              alt=""
              width={20}
              height={20}
              className="absolute left-[1.35px] top-[2.03px] size-[19.618px] object-cover"
            />
          </div>
        </Station>
        <Station number={2} top={201}>
          <WorkshopStop slot={1} title={workshops[0]} />
        </Station>
        <Station number={3} top={323}>
          <WorkshopStop slot={2} title={workshops[1]} />
        </Station>
        <Station number={4} top={445}>
          <p>{formatTime(SCHEDULE.lunch)}</p>
          <p>Lunch</p>
        </Station>
        <Station number={5} top={567}>
          <p>{formatTime(SCHEDULE.keynote)}</p>
          <p>Keynote</p>
        </Station>
        <DelegateStation delegate={delegate} />
      </ol>

      {process.env.NODE_ENV === "development" && scores && (
        <p className="absolute inset-x-4 bottom-4 font-mono text-[10px] tracking-normal text-zinc-500">
          {line} line ·{" "}
          {LINES.map((candidate) => `${candidate} ${scores[candidate]}`).join(" · ")}
        </p>
      )}
    </div>
  );
}
