export type TaskStatus =
  | "inbox"
  | "ready"
  | "scheduled"
  | "in_progress"
  | "done"
  | "cancelled"

export const TASK_STATUSES: TaskStatus[] = [
  "inbox",
  "ready",
  "scheduled",
  "in_progress",
  "done",
  "cancelled",
]

export const STATUS_LABEL: Record<TaskStatus, string> = {
  inbox: "Inbox",
  ready: "Ready",
  scheduled: "Scheduled",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled",
}

export function priorityLabel(priority: number): string {
  return `P${priority}`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function formatDeadline(deadline: number | undefined): string {
  if (deadline == null) return "—"
  return new Date(deadline).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
