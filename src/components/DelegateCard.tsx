import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { Enter } from "@/components/motion/Enter";
import { delegatePhoto } from "@/lib/delegate-photo";
import type { DelegateMatch } from "@/lib/delegate-matching/runtime";

export function DelegateCard({ match, index }: { match: DelegateMatch; index: number }) {
  return (
    <Enter as="li" delay={0.08 + index * 0.09} className="flex min-h-44 flex-1 flex-col">
      <div className="metal-panel flex min-h-44 flex-1 flex-col justify-between gap-4 p-5 [--delay:0s]">
        <div className="flex items-start gap-4">
          <Image
            src={delegatePhoto(match.delegateId)}
            alt=""
            width={72}
            height={72}
            className="size-[72px] shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 pt-1">
            <h2 className="text-[24px] font-bold leading-[26px] tracking-[-0.04em] text-balance">{match.name}</h2>
            <p className="mt-1.5 text-[15px] leading-5 text-zinc-300">{match.role}</p>
            <p className="text-[15px] leading-5 text-zinc-400">{match.company}</p>
          </div>
        </div>

        {match.linkedinUrl && (
          <a
            href={match.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="-my-1.5 inline-flex items-center gap-2 self-start rounded-md py-1.5 text-[15px] font-medium tracking-[-0.04em] text-white outline-offset-4 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-white active:opacity-60"
          >
            <Image src="/logos/linkedin.png" alt="" width={18} height={18} className="size-[18px]" />
            LinkedIn
            <ArrowUpRight aria-hidden className="size-4" />
            <span className="sr-only">: {match.name} (opens in a new tab)</span>
          </a>
        )}
      </div>
    </Enter>
  );
}
