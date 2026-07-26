import * as React from "react"
import { CalendarBlank } from "@phosphor-icons/react"

import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
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
      <div
        className="flex flex-col gap-3"
        aria-busy="true"
        aria-label="Loading timeline"
      >
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    )
  }

  if (!schedule || !blocks) {
    return (
      <Empty className="border border-dashed border-border/80 bg-card/50">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarBlank weight="duotone" />
          </EmptyMedia>
          <EmptyTitle>No schedule yet</EmptyTitle>
          <EmptyDescription>
            Generate a plan for a date range. Each block will show why it landed
            there — not just when.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const grouped = groupBlocksByDay(
    blocks,
    schedule.rangeStart,
    schedule.rangeEnd,
  )
  const overrideCount = blocks.filter((b) => b.isManualOverride).length

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border/80 pb-3">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Timeline
          </p>
          <h2 className="font-heading text-lg font-medium tracking-tight">
            {formatDayHeading(schedule.rangeStart)}
            <span className="mx-2 text-border">→</span>
            {formatDayHeading(schedule.rangeEnd)}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "capitalize",
              schedule.mode === "crunch" &&
                "border-warning/70 bg-warning/25 text-warning-foreground",
            )}
          >
            {schedule.mode} mode
          </Badge>
          <Badge variant="secondary">{blocks.length} blocks</Badge>
          {overrideCount > 0 ? (
            <Badge variant="outline" className="border-dashed">
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

      <div className="flex flex-col gap-8">
        {grouped.map(([dayStart, dayBlocks], dayIndex) => {
          const isEmpty = dayBlocks.length === 0
          return (
            <section
              key={dayStart}
              className="grid gap-3 sm:grid-cols-[7.5rem_1fr]"
              style={
                {
                  "--day-i": dayIndex,
                } as React.CSSProperties
              }
            >
              <div className="sm:sticky sm:top-4 sm:self-start">
                <p className="text-sm font-medium">
                  {formatDayHeading(dayStart)}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {isEmpty
                    ? "open"
                    : `${dayBlocks.length} block${dayBlocks.length === 1 ? "" : "s"}`}
                </p>
              </div>

              <div className="relative min-w-0">
                <div
                  aria-hidden
                  className="absolute top-2 bottom-2 left-[7px] hidden w-px bg-border sm:block"
                />
                {isEmpty ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                    No work placed through{" "}
                    {new Intl.DateTimeFormat(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(new Date(endOfLocalDay(dayStart)))}
                    .
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {dayBlocks.map((block) => (
                      <li key={block._id} className="relative sm:pl-5">
                        <span
                          aria-hidden
                          className="absolute top-4 left-0 hidden size-3.5 rounded-full border-2 border-background bg-muted-foreground/50 shadow-sm sm:block"
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
