import type { ComponentProps } from "react";

const variants = {
  ma: "bg-ma-red text-white shadow-xs hover:bg-ma-red/90",
  outline: "border border-zinc-200 bg-white shadow-xs hover:bg-zinc-100",
  google: "border border-zinc-200 bg-white/80 text-zinc-900 hover:bg-white/50",
};

type AuthButtonProps = ComponentProps<"button"> & {
  variant: keyof typeof variants;
};

export function AuthButton({ variant, className = "", ...props }: AuthButtonProps) {
  return (
    <button
      className={`inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md px-6 text-base font-medium outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-zinc-400/50 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
