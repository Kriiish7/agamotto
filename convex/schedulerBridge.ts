/**
 * Thin re-export so Convex functions can import the framework-free scheduler
 * without duplicating it under convex/.
 *
 * Convex entrypoints live in this folder; esbuild follows the relative import
 * into `src/lib/scheduler`. Do not modify scheduler code from here.
 */
export {
  schedule,
  selectMode,
  scheduleSerenity,
  scheduleCrunch,
  knapsackSelect,
  totalTaskHours,
  totalWindowHours,
  explain,
} from "../src/lib/scheduler"

export type {
  SchedulerMode,
  Task,
  Window,
  Block,
  DeferredTask,
  ScheduleResult,
  ExplainInput,
  ExplainKind,
} from "../src/lib/scheduler"
