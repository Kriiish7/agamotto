import { explain } from "./explain"
import type { Block, DeferredTask, SchedulerMode, Task, Window } from "./types"

const MS_PER_HOUR = 3_600_000

export type MutableSlot = {
  windowId: string
  cursorMs: number
  endMs: number
}

export function hoursBetween(startIso: string, endIso: string): number {
  return (Date.parse(endIso) - Date.parse(startIso)) / MS_PER_HOUR
}

export function windowDurationHours(window: Window): number {
  return Math.max(0, hoursBetween(window.start, window.end))
}

export function toMutableSlots(windows: readonly Window[]): MutableSlot[] {
  return [...windows]
    .map((window) => ({
      windowId: window.id,
      cursorMs: Date.parse(window.start),
      endMs: Date.parse(window.end),
    }))
    .filter((slot) => slot.endMs > slot.cursorMs)
    .sort((a, b) => a.cursorMs - b.cursorMs)
}

export function remainingHours(slots: readonly MutableSlot[]): number {
  return slots.reduce(
    (sum, slot) => sum + Math.max(0, (slot.endMs - slot.cursorMs) / MS_PER_HOUR),
    0,
  )
}

export function hoursUntilDeadline(
  task: Task,
  referenceMs: number,
): number | undefined {
  if (!task.deadline) return undefined
  return (Date.parse(task.deadline) - referenceMs) / MS_PER_HOUR
}

/** Priority-density used by Serenity (and as a fallback score). */
export function priorityDensity(task: Task): number {
  const duration = Math.max(task.estimatedHours, 1e-6)
  return task.priority / duration
}

/** Crunch value: priority boosted by deadline urgency. */
export function crunchScore(task: Task, referenceMs: number): number {
  const hours = hoursUntilDeadline(task, referenceMs)
  const urgency =
    hours === undefined ? 0 : 1 / Math.max(1, Math.max(hours, 0) || 1)
  return task.priority * (1 + urgency)
}

export function compareEdf(a: Task, b: Task): number {
  const aDead = a.deadline ? Date.parse(a.deadline) : Number.POSITIVE_INFINITY
  const bDead = b.deadline ? Date.parse(b.deadline) : Number.POSITIVE_INFINITY
  if (aDead !== bDead) return aDead - bDead
  if (b.priority !== a.priority) return b.priority - a.priority
  return a.id.localeCompare(b.id)
}

export function taskById(tasks: readonly Task[]): Map<string, Task> {
  return new Map(tasks.map((task) => [task.id, task]))
}

export function dependencyTitles(
  task: Task,
  byId: Map<string, Task>,
): string[] {
  return (task.dependsOn ?? [])
    .map((id) => byId.get(id)?.title ?? id)
    .filter(Boolean)
}

/**
 * Place a task across slots, optionally splitting into multiple sessions.
 * Returns blocks and any leftover hours that could not be placed.
 */
export function placeTask(
  task: Task,
  slots: MutableSlot[],
  options: {
    mode: SchedulerMode
    orderRank: number
    score: number
    referenceMs: number
    allowSplit: boolean
  },
): { blocks: Block[]; remainingHours: number } {
  let left = task.estimatedHours
  const chunks: Array<{
    windowId: string
    startMs: number
    endMs: number
    hours: number
  }> = []

  for (const slot of slots) {
    if (left <= 1e-9) break
    const freeHours = (slot.endMs - slot.cursorMs) / MS_PER_HOUR
    if (freeHours <= 1e-9) continue

    const take = options.allowSplit
      ? Math.min(left, freeHours)
      : freeHours + 1e-9 >= left
        ? left
        : 0
    if (take <= 1e-9) continue

    const startMs = slot.cursorMs
    const endMs = startMs + take * MS_PER_HOUR
    slot.cursorMs = endMs
    chunks.push({
      windowId: slot.windowId,
      startMs,
      endMs,
      hours: take,
    })
    left -= take
  }

  if (chunks.length === 0) {
    return { blocks: [], remainingHours: task.estimatedHours }
  }

  const sessionCount = chunks.length
  const until = hoursUntilDeadline(task, options.referenceMs)
  const blocks: Block[] = chunks.map((chunk, index) => {
    const sessionIndex = index + 1
    const kind =
      sessionCount > 1 && options.allowSplit ? "split" : "placed"
    return {
      taskId: task.id,
      title: task.title,
      windowId: chunk.windowId,
      start: new Date(chunk.startMs).toISOString(),
      end: new Date(chunk.endMs).toISOString(),
      hours: chunk.hours,
      sessionIndex,
      sessionCount,
      explanation: explain({
        mode: options.mode,
        task,
        kind,
        orderRank: options.orderRank,
        score: options.score,
        sessionIndex,
        sessionCount,
        hoursUntilDeadline: until,
      }),
    }
  })

  return { blocks, remainingHours: Math.max(0, left) }
}

export function defer(
  task: Task,
  mode: SchedulerMode,
  kind: "delayed" | "excluded",
  dependencyTitlesList?: string[],
): DeferredTask {
  return {
    taskId: task.id,
    title: task.title,
    reason: explain({
      mode,
      task,
      kind,
      dependencyTitles: dependencyTitlesList,
    }),
  }
}

/** True when every dependency id is in `completed`. */
export function depsSatisfied(
  task: Task,
  completed: ReadonlySet<string>,
): boolean {
  return (task.dependsOn ?? []).every((id) => completed.has(id))
}
