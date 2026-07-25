export type TaskStatus =
  | "inbox"
  | "ready"
  | "scheduled"
  | "in_progress"
  | "done"
  | "cancelled"

export type BlockStatus = "planned" | "completed" | "skipped" | "moved"

export type ScheduleMode = "serenity" | "crunch"

export type ScheduleStatus = "draft" | "active" | "superseded" | "archived"

export const TASK_STATUSES: TaskStatus[] = [
  "inbox",
  "ready",
  "scheduled",
  "in_progress",
  "done",
  "cancelled",
]

export const BLOCK_STATUSES: BlockStatus[] = [
  "planned",
  "completed",
  "skipped",
  "moved",
]

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  inbox: "Inbox",
  ready: "Ready",
  scheduled: "Scheduled",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled",
}

export const BLOCK_STATUS_LABEL: Record<BlockStatus, string> = {
  planned: "Planned",
  completed: "Completed",
  skipped: "Skipped",
  moved: "Moved",
}

export const SCHEDULE_MODE_LABEL: Record<ScheduleMode, string> = {
  serenity: "Serenity",
  crunch: "Crunch",
}

export const SCHEDULE_STATUS_LABEL: Record<ScheduleStatus, string> = {
  draft: "Draft",
  active: "Active",
  superseded: "Superseded",
  archived: "Archived",
}

/** Quiet, readable fills for proportion segments (not chart-spam). */
export const TASK_STATUS_TONE: Record<TaskStatus, string> = {
  inbox: "bg-zinc-400",
  ready: "bg-sky-500",
  scheduled: "bg-teal-500",
  in_progress: "bg-amber-500",
  done: "bg-emerald-600",
  cancelled: "bg-stone-400",
}

export const BLOCK_STATUS_TONE: Record<BlockStatus, string> = {
  planned: "bg-sky-500",
  completed: "bg-emerald-600",
  skipped: "bg-stone-400",
  moved: "bg-amber-500",
}

export function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function formatDateRange(startMs: number, endMs: number): string {
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
  const start = new Date(startMs).toLocaleDateString(undefined, opts)
  const end = new Date(endMs).toLocaleDateString(undefined, opts)
  return start === end ? start : `${start} → ${end}`
}

export function countByStatus<T extends string>(
  items: ReadonlyArray<{ status: T }>,
  order: readonly T[],
): Record<T, number> {
  const counts = Object.fromEntries(order.map((s) => [s, 0])) as Record<
    T,
    number
  >
  for (const item of items) {
    counts[item.status] = (counts[item.status] ?? 0) + 1
  }
  return counts
}
