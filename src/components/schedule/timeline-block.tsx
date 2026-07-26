import * as React from "react"
import { CaretDownIcon, PushPinIcon } from "@phosphor-icons/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Doc } from "../../../convex/_generated/dataModel"
import { formatDurationMinutes, formatTimeRange } from "./format"

type TimelineBlockProps = {
  block: Doc<"scheduleBlocks">
  title?: string
  onEdit: (block: Doc<"scheduleBlocks">) => void
  style?: React.CSSProperties
}

/**
 * Explanation-first block: reason copy is always in the layout.
 * Overrides get a dashed pin treatment; status tints the rail.
 */
export function TimelineBlockCard({
  block,
  title,
  onEdit,
  style,
}: TimelineBlockProps) {
  const [expanded, setExpanded] = React.useState(false)
  const explanation = block.explanation.trim()
  const long = explanation.length > 140
  const displayTitle = title?.trim() || "Scheduled work"

  return (
    <article
      style={style}
      className={cn(
        "group relative rounded-xl border border-border/80 bg-card/90 p-3 shadow-[0_1px_0_oklch(0.9_0.01_264)] transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-sm motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        block.isManualOverride &&
          "border-dashed border-foreground/40 bg-[linear-gradient(135deg,oklch(0.98_0.01_85)_0%,oklch(1_0_0_/_0.9)_45%)] ring-1 ring-foreground/10",
        block.status === "completed" && "opacity-70",
        block.status === "skipped" && "opacity-55",
      )}
    >
      <div
        aria-hidden
        className={cn(
          "absolute top-3 bottom-3 left-0 w-[3px] rounded-full bg-muted-foreground/50",
          block.isManualOverride && "bg-foreground/70",
          block.status === "completed" && "bg-chart-2/80",
          block.status === "skipped" && "bg-border",
        )}
      />

      <div className="flex flex-col gap-1 pl-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate text-sm font-medium tracking-tight">
                {displayTitle}
              </h3>
              {block.isManualOverride ? (
                <Badge variant="outline" className="border-dashed">
                  <PushPinIcon weight="fill" />
                  Pinned
                </Badge>
              ) : null}
              {block.status !== "planned" ? (
                <Badge variant="secondary" className="capitalize">
                  {block.status}
                </Badge>
              ) : null}
            </div>
            <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
              {formatTimeRange(block.start, block.end)}
              <span className="mx-1.5 text-border">·</span>
              {formatDurationMinutes(block.start, block.end)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 opacity-80 group-hover:opacity-100"
            onClick={() => onEdit(block)}
          >
            Move
          </Button>
        </div>

        <div className="mt-2 rounded-lg bg-muted/70 px-2.5 py-2 ring-1 ring-border/60">
          <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Why here
          </p>
          <p
            className={cn(
              "mt-1 text-sm leading-relaxed text-foreground/85",
              !expanded && long && "line-clamp-2",
            )}
            title={explanation}
          >
            {explanation || "No explanation recorded for this block."}
          </p>
          {long ? (
            <Button
              type="button"
              variant="link"
              size="xs"
              className="mt-1 h-auto px-0"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              <CaretDownIcon
                data-icon="inline-start"
                className={cn(
                  "transition-transform motion-reduce:transition-none",
                  expanded && "rotate-180",
                )}
              />
              {expanded ? "Show less" : "Full explanation"}
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  )
}
