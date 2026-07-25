import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ProhibitIcon, TimerIcon } from "@phosphor-icons/react"
import type { DeferredItem } from "./types"

type DeferredPanelProps = {
  delayed: DeferredItem[]
  excluded: DeferredItem[]
  mode?: "serenity" | "crunch" | null
}

/**
 * Delayed / excluded are first-class — reasons sit in the panel body, not
 * tooltips. Crunch delays get a warm amber rail; exclusions stay cool zinc.
 */
export function DeferredPanel({ delayed, excluded, mode }: DeferredPanelProps) {
  if (delayed.length === 0 && excluded.length === 0) return null

  return (
    <section className="space-y-4" aria-label="Deferred and excluded work">
      {delayed.length > 0 ? (
        <div
          className={cn(
            "overflow-hidden rounded-2xl border",
            mode === "crunch"
              ? "border-amber-300/70 bg-gradient-to-br from-amber-50 via-orange-50/40 to-zinc-50"
              : "border-zinc-200 bg-zinc-50/80",
          )}
        >
          <header className="flex flex-wrap items-center gap-2 border-b border-inherit px-4 py-3">
            <TimerIcon
              className={cn(
                "size-4",
                mode === "crunch" ? "text-amber-800" : "text-zinc-600",
              )}
              weight="duotone"
            />
            <h2
              className={cn(
                "text-sm font-medium",
                mode === "crunch" ? "text-amber-950" : "text-zinc-800",
              )}
            >
              Delayed
            </h2>
            <Badge
              variant="outline"
              className={
                mode === "crunch"
                  ? "border-amber-400/80 bg-amber-100/60 text-amber-900"
                  : undefined
              }
            >
              {delayed.length}
            </Badge>
            {mode === "crunch" ? (
              <span className="text-xs text-amber-800/80">
                Held out of the Crunch budget
              </span>
            ) : (
              <span className="text-xs text-zinc-500">
                Waiting on capacity or dependencies
              </span>
            )}
          </header>
          <ul className="divide-y divide-amber-200/40">
            {delayed.map((item) => (
              <li key={`delayed-${item.taskId}`} className="px-4 py-3">
                <p
                  className={cn(
                    "text-sm font-medium",
                    mode === "crunch" ? "text-amber-950" : "text-zinc-900",
                  )}
                >
                  {item.title}
                </p>
                <p
                  className={cn(
                    "mt-1 text-sm leading-relaxed",
                    mode === "crunch" ? "text-amber-900/85" : "text-zinc-600",
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
        <div className="overflow-hidden rounded-2xl border border-dashed border-zinc-400/70 bg-[repeating-linear-gradient(-45deg,oklch(0.97_0_0),oklch(0.97_0_0)_8px,oklch(0.94_0_0)_8px,oklch(0.94_0_0)_16px)]">
          <header className="flex flex-wrap items-center gap-2 border-b border-dashed border-zinc-300 bg-white/70 px-4 py-3 backdrop-blur-sm">
            <ProhibitIcon className="size-4 text-zinc-600" weight="duotone" />
            <h2 className="text-sm font-medium text-zinc-800">Excluded</h2>
            <Badge variant="outline" className="border-zinc-400 text-zinc-700">
              {excluded.length}
            </Badge>
            <span className="text-xs text-zinc-500">
              Could not fit any available window
            </span>
          </header>
          <ul className="divide-y divide-dashed divide-zinc-300/80 bg-white/55">
            {excluded.map((item) => (
              <li key={`excluded-${item.taskId}`} className="px-4 py-3">
                <p className="text-sm font-medium text-zinc-800 line-through decoration-zinc-400/80">
                  {item.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">
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
