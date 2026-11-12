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
      <label htmlFor={field.name} className="text-sm font-medium leading-none">
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
        className="h-12 w-full min-w-0 rounded-md border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-xs outline-none transition-[color,box-shadow] placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-[3px] focus-visible:ring-zinc-400/50"
      />
      {isTouched && errors.length > 0 && (
        <p className="text-xs text-ma-red">{errors.join(", ")}</p>
      )}
    </div>
  );
}
