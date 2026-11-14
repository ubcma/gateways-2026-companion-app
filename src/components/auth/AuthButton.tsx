import type { ComponentProps } from "react";

const variants = {
  ma: "bg-white text-night shadow-none hover:bg-white/90",
  outline: "border border-white/20 bg-transparent text-white hover:bg-white/10",
  google: "border border-white/20 bg-white/5 text-white hover:bg-white/10",
};

type AuthButtonProps = ComponentProps<"button"> & {
  variant: keyof typeof variants;
};

export function AuthButton({ variant, className = "", ...props }: AuthButtonProps) {
  return (
    <button
      className={`inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 font-display text-[15px] font-medium tracking-[-0.04em] outline-offset-4 transition-all focus-visible:outline-2 focus-visible:outline-white active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
