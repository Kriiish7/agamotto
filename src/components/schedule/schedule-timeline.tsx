import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { Doc, Id } from "../../../convex/_generated/dataModel"
import { DeferredPanel } from "./deferred-panel"
import {
  eachLocalDay,
  endOfLocalDay,
  formatDayHeading,
  startOfLocalDay,
} from "./format"
import { TimelineBlockCard } from "./timeline-block"
import type { DeferredItem } from "./types"

type TaskTitleMap = Map<Id<"tasks">, string>

type ScheduleTimelineProps = {
  schedule: Doc<"schedules"> | null | undefined
  blocks: Doc<"scheduleBlocks">[] | undefined
  taskTitles?: TaskTitleMap
  delayed: DeferredItem[]
  excluded: DeferredItem[]
  loading?: boolean
  onEditBlock: (block: Doc<"scheduleBlocks">) => void
}

function groupBlocksByDay(
  blocks: Doc<"scheduleBlocks">[],
  rangeStart: number,
  rangeEnd: number,
) {
  const days = eachLocalDay(rangeStart, rangeEnd)
  const map = new Map<number, Doc<"scheduleBlocks">[]>()
  for (const day of days) {
    map.set(day, [])
  }
  for (const block of blocks) {
    const day = startOfLocalDay(block.start)
    const list = map.get(day)
    if (list) {
      list.push(block)
    } else {
      // Outside displayed range — still show under that day key
      map.set(day, [block])
    }
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.start - b.start)
  }
  return [...map.entries()].sort(([a], [b]) => a - b)
}

export function ScheduleTimeline({
  schedule,
  blocks,
  taskTitles,
  delayed,
  excluded,
  loading,
  onEditBlock,
}: ScheduleTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading timeline">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    )
  }

  if (!schedule || !blocks) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 px-5 py-10 text-center">
        <p className="text-sm font-medium text-zinc-800">No schedule yet</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
          Generate a plan for a date range. Each block will show{" "}
          <span className="text-zinc-700">why</span> it landed there — not just
          when.
        </p>
      </div>
    )
  }

  const grouped = groupBlocksByDay(
    blocks,
    schedule.rangeStart,
    schedule.rangeEnd,
  )
  const overrideCount = blocks.filter((b) => b.isManualOverride).length

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <p className="text-[10px] font-medium tracking-[0.16em] text-zinc-400 uppercase">
            Timeline
          </p>
          <h2 className="mt-1 text-lg font-medium tracking-tight text-zinc-900">
            {formatDayHeading(schedule.rangeStart)}
            <span className="mx-2 text-zinc-300">→</span>
            {formatDayHeading(schedule.rangeEnd)}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "capitalize",
              schedule.mode === "crunch"
                ? "border-amber-400 bg-amber-50 text-amber-950"
                : "border-zinc-300 bg-zinc-50 text-zinc-800",
            )}
          >
            {schedule.mode} mode
          </Badge>
          <Badge variant="secondary">{blocks.length} blocks</Badge>
          {overrideCount > 0 ? (
            <Badge
              variant="outline"
              className="border-dashed border-zinc-500 text-zinc-700"
            >
              {overrideCount} pinned
            </Badge>
          ) : null}
        </div>
      </header>

      <DeferredPanel
        delayed={delayed}
        excluded={excluded}
        mode={schedule.mode}
      />

      <div className="space-y-8">
        {grouped.map(([dayStart, dayBlocks], dayIndex) => {
          const isEmpty = dayBlocks.length === 0
          return (
            <section
              key={dayStart}
              className="grid gap-3 sm:grid-cols-[7.5rem_1fr]"
              style={
                {
                  "--day-i": dayIndex,
                  animationDelay: `${dayIndex * 40}ms`,
                } as React.CSSProperties
              }
            >
              <div className="sm:sticky sm:top-4 sm:self-start">
                <p className="text-sm font-medium text-zinc-900">
                  {formatDayHeading(dayStart)}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-zinc-400">
                  {isEmpty
                    ? "open"
                    : `${dayBlocks.length} block${dayBlocks.length === 1 ? "" : "s"}`}
                </p>
              </div>

              <div className="relative min-w-0">
                <div
                  aria-hidden
                  className="absolute top-2 bottom-2 left-[7px] hidden w-px bg-zinc-200 sm:block"
                />
                {isEmpty ? (
                  <p className="rounded-xl border border-dashed border-zinc-200 px-3 py-4 text-sm text-zinc-400">
                    No work placed through{" "}
                    {new Intl.DateTimeFormat(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(new Date(endOfLocalDay(dayStart)))}
                    .
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {dayBlocks.map((block, i) => (
                      <li
                        key={block._id}
                        className="relative sm:pl-5"
                        style={{
                          animationDelay: `${dayIndex * 40 + i * 30}ms`,
                        }}
                      >
                        <span
                          aria-hidden
                          className="absolute top-4 left-0 hidden size-3.5 rounded-full border-2 border-white bg-zinc-400 shadow-sm sm:block"
                        />
                        <TimelineBlockCard
                          block={block}
                          title={taskTitles?.get(block.taskId)}
                          onEdit={onEditBlock}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
