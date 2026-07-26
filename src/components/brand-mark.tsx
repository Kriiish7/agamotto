import { cn } from "@/lib/utils"

type BrandMarkProps = {
  className?: string
  size?: "sm" | "md" | "lg"
  showWordmark?: boolean
}

const sizeMap = {
  sm: "size-8 text-sm",
  md: "size-10 text-base",
  lg: "size-14 text-xl",
} as const

export function BrandMark({
  className,
  size = "md",
  showWordmark = false,
}: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-2xl bg-primary font-semibold text-primary-foreground shadow-[inset_0_1px_0_oklch(1_0_0_/_0.22)]",
          sizeMap[size],
        )}
        aria-hidden
      >
        <span className="relative z-10">A</span>
        <span className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,oklch(1_0_0_/_0.25),transparent_55%)]" />
      </div>
      {showWordmark ? (
        <div className="min-w-0">
          <p className="font-heading text-lg font-semibold tracking-tight">
            Agamotto
          </p>
          <p className="text-xs text-muted-foreground">
            Schedule with reasons
          </p>
        </div>
      ) : null}
    </div>
  )
}
