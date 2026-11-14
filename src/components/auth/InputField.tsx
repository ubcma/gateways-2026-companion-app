import type { AnyFieldApi } from "@tanstack/react-form";

type InputFieldProps = {
  type?: string;
  label: string;
  field: AnyFieldApi;
};

export function InputField({ type, label, field }: InputFieldProps) {
  const { isTouched, errors } = field.state.meta;

  return (
    <div className="flex w-full flex-col gap-2 text-left">
      <label htmlFor={field.name} className="text-sm font-medium leading-none text-zinc-300">
        {label}
      </label>
      <input
        id={field.name}
        name={field.name}
        type={type}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={label}
        autoComplete={type === "password" ? "current-password" : type}
        className="h-12 w-full min-w-0 rounded-2xl border border-white/15 bg-white/5 px-4 font-display text-[15px] tracking-[-0.04em] text-white outline-offset-4 transition-[color,box-shadow,border-color,background-color] placeholder:text-zinc-500 focus-visible:border-white/40 focus-visible:bg-white/8 focus-visible:outline-2 focus-visible:outline-white"
      />
      {isTouched && errors.length > 0 && (
        <p className="text-xs text-ma-red">{errors.join(", ")}</p>
      )}
    </div>
  );
}
