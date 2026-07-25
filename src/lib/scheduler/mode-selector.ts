import type { SchedulerMode, Task, Window } from "./types"

const MS_PER_HOUR = 3_600_000

/** Sum of task estimates in hours. */
export function totalTaskHours(tasks: readonly Task[]): number {
  return tasks.reduce((sum, task) => sum + Math.max(0, task.estimatedHours), 0)
}

/** Sum of window lengths in hours. */
export function totalWindowHours(windows: readonly Window[]): number {
  return windows.reduce((sum, window) => {
    const hours =
      (Date.parse(window.end) - Date.parse(window.start)) / MS_PER_HOUR
    return sum + Math.max(0, hours)
  }, 0)
}

/**
 * Pick Serenity when everything fits in available windows;
 * otherwise Crunch (including zero-availability overload).
 */
export function selectMode(
  tasks: readonly Task[],
  windows: readonly Window[],
): SchedulerMode {
  const available = totalWindowHours(windows)
  if (available <= 0) {
    return "crunch"
  }
  return totalTaskHours(tasks) <= available ? "serenity" : "crunch"
}
