import { cn } from "@/lib/utils";

export function Logo({
  className,
  showText = true,
  size = "default",
}: {
  className?: string;
  showText?: boolean;
  size?: "sm" | "default" | "lg";
}) {
  const box = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-10 w-10" : "h-8 w-8";
  const text =
    size === "sm" ? "text-base" : size === "lg" ? "text-xl" : "text-lg";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "relative grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft",
          box
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-[60%] w-[60%]">
          <path
            d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11a2 2 0 0 1 2 2v12a1.5 1.5 0 0 0-1.5-1.5H5.5A1.5 1.5 0 0 1 4 15V5.5Z"
            fill="currentColor"
            opacity=".95"
          />
          <path
            d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13a2 2 0 0 0-2 2v12a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 0 20 15V5.5Z"
            fill="currentColor"
            opacity=".65"
          />
          <circle cx="12" cy="9" r="1.6" fill="currentColor" />
        </svg>
      </span>
      {showText ? (
        <span
          className={cn(
            "font-display font-bold tracking-tight",
            text
          )}
        >
          Study<span className="text-primary">Smart</span>
          <span className="text-muted-foreground"> AI</span>
        </span>
      ) : null}
    </span>
  );
}
