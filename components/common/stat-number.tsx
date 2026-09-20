import { cn } from "@/lib/utils";

type StatNumberProps = {
  /** Already formatted (use lib/format.ts helpers). */
  value: string;
  label: string;
  sublabel?: string;
  size?: "md" | "lg";
  tone?: "default" | "primary" | "muted";
  align?: "start" | "center";
  className?: string;
};

const sizeClass = {
  md: "text-3xl",
  lg: "text-4xl",
} as const;

const toneClass = {
  default: "text-foreground",
  primary: "text-primary",
  muted: "text-muted-foreground",
} as const;

/** Big friendly number with a small label underneath. Pure: no hooks, no text. */
export function StatNumber({
  value,
  label,
  sublabel,
  size = "md",
  tone = "default",
  align = "start",
  className,
}: StatNumberProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        align === "center" ? "items-center text-center" : "items-start text-start",
        className,
      )}
    >
      <span
        className={cn(
          "tabular font-semibold leading-none tracking-tight",
          sizeClass[size],
          toneClass[tone],
        )}
      >
        {value}
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
      {sublabel ? <span className="text-xs text-muted-foreground">{sublabel}</span> : null}
    </div>
  );
}
