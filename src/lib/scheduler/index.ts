import { selectMode } from "./mode-selector"
import { scheduleCrunch } from "./crunch"
import { scheduleSerenity } from "./serenity"
import type { ScheduleResult, Task, Window } from "./types"

export type { SchedulerMode, Task, Window, Block, DeferredTask, ScheduleResult } from "./types"
export { selectMode, totalTaskHours, totalWindowHours } from "./mode-selector"
export { scheduleSerenity } from "./serenity"
export { scheduleCrunch, knapsackSelect } from "./crunch"
export { explain } from "./explain"
export type { ExplainInput, ExplainKind } from "./explain"

/**
 * Auto-select Serenity or Crunch from workload vs availability, then schedule.
 */
export function schedule(
  tasks: readonly Task[],
  windows: readonly Window[],
): ScheduleResult {
  const mode = selectMode(tasks, windows)
  return mode === "serenity"
    ? scheduleSerenity(tasks, windows)
    : scheduleCrunch(tasks, windows)
}
