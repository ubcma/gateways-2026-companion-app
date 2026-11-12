export const NEXT_PARAM = "next";

// Only same-origin paths, so `?next=` can't be used as an open redirect.
export function safeNextPath(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return "/";
  }
  return value;
}
