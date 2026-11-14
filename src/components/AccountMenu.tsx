"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";

type AccountMenuProps = {
  name: string;
  email: string;
  image?: string | null;
};

function initials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? email)[0];
  return (letters ?? "").toUpperCase();
}

export function AccountMenu({ name, email, image }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Account"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="block size-12 cursor-pointer rounded-full outline-offset-4 transition-transform focus-visible:outline-2 focus-visible:outline-white active:scale-95"
      >
        <span className="flex size-full items-center justify-center overflow-hidden rounded-full bg-zinc-800">
          {image ? (
            <Image src={image} alt="" width={48} height={48} unoptimized className="size-full object-cover" />
          ) : (
            <span className="text-lg font-bold tracking-[-0.04em] text-white">{initials(name, email)}</span>
          )}
        </span>
      </button>

      {open && (
        <div
          id={menuId}
          className="metal-panel absolute right-0 top-full z-20 mt-3 w-60 rounded-2xl p-2 [--delay:0s]"
        >
          <div className="px-3 pb-2 pt-1.5">
            <p className="truncate text-sm font-semibold text-white">{name}</p>
            <p className="truncate text-xs text-zinc-400">{email}</p>
          </div>
          <SignOutButton className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10 disabled:opacity-50" />
        </div>
      )}
    </div>
  );
}
