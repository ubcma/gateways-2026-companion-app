import { formatTime } from "@/lib/format";
import type { Session, SessionType } from "@/lib/types";

const typeLabel: Record<SessionType, string> = {
  keynote: "Speaker",
  workshop: "Workshop",
  networking: "Networking",
  break: "Break",
};

export function SessionCard({ session }: { session: Session }) {
  return (
    <li className="flex gap-4">
      <time className="w-20 shrink-0 pt-0.5 text-sm font-medium text-zinc-500">
        {formatTime(session.start)}
      </time>
      <div className="flex-1 rounded-xl border border-zinc-200 p-3">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {typeLabel[session.type]}
        </span>
        <h3 className="font-semibold">{session.title}</h3>
        <p className="text-sm text-zinc-600">
          {formatTime(session.start)} – {formatTime(session.end)} ·{" "}
          {session.location}
        </p>
        {session.speaker && (
          <p className="text-sm text-zinc-600">Speaker: {session.speaker}</p>
        )}
        {session.description && (
          <p className="mt-1 text-sm text-zinc-500">{session.description}</p>
        )}
      </div>
    </li>
  );
}
