/** Scheduler mode chosen by comparing workload to available time. */
export type SchedulerMode = "serenity" | "crunch"

/** A schedulable unit of work. Plain data — no Convex or UI types. */
export type Task = {
  id: string
  title: string
  /** Estimated effort in hours (may be fractional). */
  estimatedHours: number
  /** Higher = more important. Typical range 1–10. */
  priority: number
  /** ISO date or datetime. Earlier deadlines win EDF ties / ordering. */
  deadline?: string
  /** Task ids that must be fully placed before this task may start. */
  dependsOn?: string[]
}

/** A contiguous availability interval. */
export type Window = {
  id: string
  /** ISO datetime */
  start: string
  /** ISO datetime */
  end: string
}

/** One placed session of a task inside a window. */
export type Block = {
  taskId: string
  title: string
  windowId: string
  start: string
  end: string
  hours: number
  /** Plain-language product copy explaining this placement. */
  explanation: string
  /** 1-based index when a task is split across sessions. */
  sessionIndex: number
  /** Total sessions for this task in the result. */
  sessionCount: number
}

/** A task that was not placed, with a human-readable reason. */
export type DeferredTask = {
  taskId: string
  title: string
  reason: string
}

export type ScheduleResult = {
  mode: SchedulerMode
  blocks: Block[]
  /** Selected or attempted but pushed past this horizon. */
  delayed: DeferredTask[]
  /** Cannot fit even partially under current windows / budget. */
  excluded: DeferredTask[]
}
