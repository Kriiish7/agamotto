import { ProhibitIcon, TimerIcon } from "@phosphor-icons/react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { DeferredItem } from "./types"

type DeferredPanelProps = {
  delayed: DeferredItem[]
  excluded: DeferredItem[]
  mode?: "serenity" | "crunch" | null
}

/**
 * Delayed / excluded are first-class — reasons sit in the panel body.
 * Crunch delays use the warning token; exclusions stay muted + dashed.
 */
export function DeferredPanel({ delayed, excluded, mode }: DeferredPanelProps) {
  if (delayed.length === 0 && excluded.length === 0) return null

  return (
    <section className="flex flex-col gap-4" aria-label="Deferred and excluded work">
      {delayed.length > 0 ? (
        <div
          className={cn(
            "overflow-hidden rounded-2xl border",
            mode === "crunch"
              ? "border-warning/60 bg-warning/20"
              : "border-border bg-muted/50",
          )}
        >
          <header className="flex flex-wrap items-center gap-2 border-b border-inherit px-4 py-3">
            <TimerIcon
              className={cn(
                "size-4",
                mode === "crunch"
                  ? "text-warning-foreground"
                  : "text-muted-foreground",
              )}
              weight="duotone"
            />
            <h2
              className={cn(
                "text-sm font-medium",
                mode === "crunch"
                  ? "text-warning-foreground"
                  : "text-foreground",
              )}
            >
              Delayed
            </h2>
            <Badge
              variant="outline"
              className={
                mode === "crunch"
                  ? "border-warning/70 bg-warning/30 text-warning-foreground"
                  : undefined
              }
            >
              {delayed.length}
            </Badge>
            <span
              className={cn(
                "text-xs",
                mode === "crunch"
                  ? "text-warning-foreground/80"
                  : "text-muted-foreground",
              )}
            >
              {mode === "crunch"
                ? "Held out of the Crunch budget"
                : "Waiting on capacity or dependencies"}
            </span>
          </header>
          <ul className="divide-y divide-border/60">
            {delayed.map((item) => (
              <li key={`delayed-${item.taskId}`} className="px-4 py-3">
                <p
                  className={cn(
                    "text-sm font-medium",
                    mode === "crunch"
                      ? "text-warning-foreground"
                      : "text-foreground",
                  )}
                >
                  {item.title}
                </p>
                <p
                  className={cn(
                    "mt-1 text-sm leading-relaxed",
                    mode === "crunch"
                      ? "text-warning-foreground/85"
                      : "text-muted-foreground",
                  )}
                >
                  {item.reason}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {excluded.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-dashed border-muted-foreground/40 bg-[repeating-linear-gradient(-45deg,oklch(0.97_0.005_264),oklch(0.97_0.005_264)_8px,oklch(0.94_0.008_264)_8px,oklch(0.94_0.008_264)_16px)]">
          <header className="flex flex-wrap items-center gap-2 border-b border-dashed border-border bg-card/70 px-4 py-3 backdrop-blur-sm">
            <ProhibitIcon
              className="size-4 text-muted-foreground"
              weight="duotone"
            />
            <h2 className="text-sm font-medium">Excluded</h2>
            <Badge variant="outline">{excluded.length}</Badge>
            <span className="text-xs text-muted-foreground">
              Could not fit any available window
            </span>
          </header>
          <ul className="divide-y divide-dashed divide-border/80 bg-card/55">
            {excluded.map((item) => (
              <li key={`excluded-${item.taskId}`} className="px-4 py-3">
                <p className="text-sm font-medium line-through decoration-muted-foreground/70">
                  {item.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {item.reason}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
