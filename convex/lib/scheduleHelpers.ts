import type { Doc, Id } from "../_generated/dataModel"
import type { Task, Window } from "../schedulerBridge"

const MS_PER_MINUTE = 60_000

export type WorkingHourWindow = {
  dayOfWeek: number
  startMinutes: number
  endMinutes: number
}

export type OccupiedInterval = {
  start: number
  end: number
}

type ZonedParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: number
}

const WEEKDAY_TO_JS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

/** Statuses the scheduler may place. */
export const SCHEDULABLE_TASK_STATUSES = new Set([
  "inbox",
  "ready",
  "scheduled",
  "in_progress",
])

export function isSchedulableTask(task: Doc<"tasks">): boolean {
  return SCHEDULABLE_TASK_STATUSES.has(task.status)
}

export function getZonedParts(utcMs: number, timeZone: string): ZonedParts {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  })
  const parts = dtf.formatToParts(new Date(utcMs))
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ""

  const weekday = get("weekday")
  const dayOfWeek = WEEKDAY_TO_JS[weekday]
  if (dayOfWeek === undefined) {
    throw new Error(`Unexpected weekday token "${weekday}" for zone ${timeZone}`)
  }

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
    dayOfWeek,
  }
}

/**
 * Convert a civil datetime in `timeZone` to a UTC epoch ms.
 * Iteratively corrects for DST offsets.
 */
export function zonedLocalToUtc(
  year: number,
  month: number,
  day: number,
  minutesOfDay: number,
  timeZone: string,
): number {
  const hour = Math.floor(minutesOfDay / 60)
  const minute = minutesOfDay % 60
  let guess = Date.UTC(year, month - 1, day, hour, minute, 0)

  for (let i = 0; i < 4; i += 1) {
    const parts = getZonedParts(guess, timeZone)
    const asLocalUtcGuess = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    )
    const desired = Date.UTC(year, month - 1, day, hour, minute, 0)
    const diff = desired - asLocalUtcGuess
    if (diff === 0) break
    guess += diff
  }

  return guess
}

/** Inclusive calendar days that intersect [rangeStart, rangeEnd] in `timeZone`. */
export function eachCalendarDayInRange(
  rangeStart: number,
  rangeEnd: number,
  timeZone: string,
): Array<{ year: number; month: number; day: number; dayOfWeek: number }> {
  if (rangeEnd < rangeStart) return []

  const startParts = getZonedParts(rangeStart, timeZone)
  let cursor = zonedLocalToUtc(
    startParts.year,
    startParts.month,
    startParts.day,
    0,
    timeZone,
  )

  const days: Array<{
    year: number
    month: number
    day: number
    dayOfWeek: number
  }> = []

  // Safety cap: ~2 years of daily windows.
  for (let i = 0; i < 800; i += 1) {
    const parts = getZonedParts(cursor, timeZone)
    const dayStart = zonedLocalToUtc(
      parts.year,
      parts.month,
      parts.day,
      0,
      timeZone,
    )
    const dayEnd = zonedLocalToUtc(
      parts.year,
      parts.month,
      parts.day,
      24 * 60,
      timeZone,
    )

    if (dayStart > rangeEnd) break
    if (dayEnd > rangeStart) {
      days.push({
        year: parts.year,
        month: parts.month,
        day: parts.day,
        dayOfWeek: parts.dayOfWeek,
      })
    }

    // Advance ~1 day in local time (DST-safe via re-read).
    cursor = dayEnd + MS_PER_MINUTE
  }

  return days
}

/**
 * Expand per-weekday working-hour windows into absolute ISO availability
 * windows clipped to [rangeStart, rangeEnd].
 */
export function buildAvailabilityWindows(
  workingHours: readonly WorkingHourWindow[],
  rangeStart: number,
  rangeEnd: number,
  timeZone: string,
): Window[] {
  const byDay = new Map<number, WorkingHourWindow[]>()
  for (const wh of workingHours) {
    if (wh.endMinutes <= wh.startMinutes) continue
    const list = byDay.get(wh.dayOfWeek) ?? []
    list.push(wh)
    byDay.set(wh.dayOfWeek, list)
  }

  const windows: Window[] = []
  let seq = 0

  for (const day of eachCalendarDayInRange(rangeStart, rangeEnd, timeZone)) {
    const windowsForDay = byDay.get(day.dayOfWeek) ?? []
    for (const wh of windowsForDay) {
      const startMs = zonedLocalToUtc(
        day.year,
        day.month,
        day.day,
        wh.startMinutes,
        timeZone,
      )
      const endMs = zonedLocalToUtc(
        day.year,
        day.month,
        day.day,
        wh.endMinutes,
        timeZone,
      )
      const clippedStart = Math.max(startMs, rangeStart)
      const clippedEnd = Math.min(endMs, rangeEnd)
      if (clippedEnd <= clippedStart) continue

      seq += 1
      windows.push({
        id: `w-${day.year}${String(day.month).padStart(2, "0")}${String(day.day).padStart(2, "0")}-${seq}`,
        start: new Date(clippedStart).toISOString(),
        end: new Date(clippedEnd).toISOString(),
      })
    }
  }

  return windows.sort(
    (a, b) => Date.parse(a.start) - Date.parse(b.start),
  )
}

/**
 * Carve occupied intervals out of availability windows so the packer
 * schedules around fixed/manual blocks.
 */
export function subtractOccupiedFromWindows(
  windows: readonly Window[],
  occupied: readonly OccupiedInterval[],
): Window[] {
  if (occupied.length === 0) {
    return windows.map((w) => ({ ...w }))
  }

  const sortedOcc = [...occupied]
    .filter((o) => o.end > o.start)
    .sort((a, b) => a.start - b.start)

  const result: Window[] = []
  let seq = 0

  for (const window of windows) {
    let freeSegments: Array<{ start: number; end: number }> = [
      { start: Date.parse(window.start), end: Date.parse(window.end) },
    ]

    for (const occ of sortedOcc) {
      const next: Array<{ start: number; end: number }> = []
      for (const seg of freeSegments) {
        if (occ.end <= seg.start || occ.start >= seg.end) {
          next.push(seg)
          continue
        }
        if (occ.start > seg.start) {
          next.push({ start: seg.start, end: Math.min(occ.start, seg.end) })
        }
        if (occ.end < seg.end) {
          next.push({ start: Math.max(occ.end, seg.start), end: seg.end })
        }
      }
      freeSegments = next
    }

    for (const seg of freeSegments) {
      if (seg.end <= seg.start) continue
      seq += 1
      result.push({
        id: `${window.id}-free-${seq}`,
        start: new Date(seg.start).toISOString(),
        end: new Date(seg.end).toISOString(),
      })
    }
  }

  return result
}

/** Map a Convex task document into the scheduler's plain Task shape. */
export function toSchedulerTask(
  task: Doc<"tasks">,
  estimatedMinutes?: number,
): Task {
  const minutes = estimatedMinutes ?? task.durationMinutes
  return {
    id: task._id,
    title: task.title,
    estimatedHours: Math.max(0, minutes) / 60,
    priority: task.priority,
    deadline:
      task.deadline !== undefined
        ? new Date(task.deadline).toISOString()
        : undefined,
    dependsOn:
      task.dependsOn.length > 0
        ? task.dependsOn.map((id) => id as string)
        : undefined,
  }
}

/**
 * Remaining effort for a task after accounting for blocks we will keep fixed
 * (manual overrides and already-finished work).
 */
export function remainingMinutesForTask(
  task: Doc<"tasks">,
  keptBlocks: readonly Doc<"scheduleBlocks">[],
): number {
  const used = keptBlocks
    .filter((b) => b.taskId === task._id)
    .reduce((sum, b) => sum + Math.max(0, b.end - b.start), 0)
  const usedMinutes = used / MS_PER_MINUTE
  return Math.max(0, task.durationMinutes - usedMinutes)
}

export function parseTaskId(id: string): Id<"tasks"> {
  return id as Id<"tasks">
}

/** Blocks that must stay put when regenerating. */
export function isFixedBlock(block: Doc<"scheduleBlocks">): boolean {
  return block.isManualOverride || block.status !== "planned"
}
