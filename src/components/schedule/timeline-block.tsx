import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CaretDownIcon, PushPinIcon } from "@phosphor-icons/react"
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
        "group relative rounded-xl border bg-white/90 p-3 shadow-[0_1px_0_oklch(0.9_0_0)] transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-sm",
        block.isManualOverride
          ? "border-dashed border-zinc-500 bg-[linear-gradient(135deg,oklch(0.98_0.005_85)_0%,oklch(1_0_0)_45%)] ring-1 ring-zinc-400/30"
          : "border-zinc-200/90",
        block.status === "completed" && "opacity-70",
        block.status === "skipped" && "opacity-55",
      )}
    >
      <div
        aria-hidden
        className={cn(
          "absolute top-3 bottom-3 left-0 w-[3px] rounded-full",
          block.isManualOverride
            ? "bg-zinc-700"
            : block.status === "completed"
              ? "bg-emerald-600/70"
              : block.status === "skipped"
                ? "bg-zinc-300"
                : "bg-zinc-400",
        )}
      />

      <div className="pl-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate text-sm font-medium tracking-tight text-zinc-900">
                {displayTitle}
              </h3>
              {block.isManualOverride ? (
                <Badge
                  variant="outline"
                  className="border-dashed border-zinc-500 text-zinc-700"
                >
                  <PushPinIcon className="size-3" weight="fill" />
                  Pinned
                </Badge>
              ) : null}
              {block.status !== "planned" ? (
                <Badge variant="secondary" className="capitalize">
                  {block.status}
                </Badge>
              ) : null}
            </div>
            <p className="font-mono text-[11px] tracking-wide text-zinc-500">
              {formatTimeRange(block.start, block.end)}
              <span className="mx-1.5 text-zinc-300">·</span>
              {formatDurationMinutes(block.start, block.end)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="shrink-0 text-zinc-600 opacity-80 group-hover:opacity-100"
            onClick={() => onEdit(block)}
          >
            Move
          </Button>
        </div>

        <div className="mt-2.5 rounded-lg bg-zinc-50/90 px-2.5 py-2 ring-1 ring-zinc-100">
          <p className="text-[10px] font-medium tracking-[0.14em] text-zinc-400 uppercase">
            Why here
          </p>
          <p
            className={cn(
              "mt-1 text-sm leading-relaxed text-zinc-700",
              !expanded && long && "line-clamp-2",
            )}
            title={explanation}
          >
            {explanation || "No explanation recorded for this block."}
          </p>
          {long ? (
            <button
              type="button"
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-zinc-600 underline-offset-2 hover:underline"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              <CaretDownIcon
                className={cn(
                  "size-3 transition-transform",
                  expanded && "rotate-180",
                )}
              />
              {expanded ? "Show less" : "Full explanation"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}
