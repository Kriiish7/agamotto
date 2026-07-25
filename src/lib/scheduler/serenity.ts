import {
  compareEdf,
  defer,
  dependencyTitles,
  depsSatisfied,
  placeTask,
  priorityDensity,
  remainingHours,
  taskById,
  toMutableSlots,
} from "./placement"
import type { Block, DeferredTask, ScheduleResult, Task, Window } from "./types"

/**
 * Serenity: greedy priority-density placement with EDF tiebreak.
 * Long tasks split across windows into multiple sessions.
 */
export function scheduleSerenity(
  tasks: readonly Task[],
  windows: readonly Window[],
): ScheduleResult {
  const slots = toMutableSlots(windows)
  const byId = taskById(tasks)
  const referenceMs = slots[0]?.cursorMs ?? Date.now()

  const blocks: Block[] = []
  const delayed: DeferredTask[] = []
  const excluded: DeferredTask[] = []
  const completed = new Set<string>()
  const pending = new Set(tasks.map((task) => task.id))

  let orderRank = 0

  while (pending.size > 0) {
    if (remainingHours(slots) <= 1e-9) {
      for (const id of pending) {
        const task = byId.get(id)
        if (!task) continue
        delayed.push(
          defer(task, "serenity", "delayed", dependencyTitles(task, byId)),
        )
      }
      break
    }

    const ready = [...pending]
      .map((id) => byId.get(id))
      .filter((task): task is Task => !!task && depsSatisfied(task, completed))

    if (ready.length === 0) {
      // Dependency cycle or deps never placed — exclude remaining.
      for (const id of pending) {
        const task = byId.get(id)
        if (!task) continue
        excluded.push(
          defer(task, "serenity", "excluded", dependencyTitles(task, byId)),
        )
      }
      break
    }

    ready.sort((a, b) => {
      const scoreDiff = priorityDensity(b) - priorityDensity(a)
      if (Math.abs(scoreDiff) > 1e-9) return scoreDiff
      return compareEdf(a, b)
    })

    const task = ready[0]!
    orderRank += 1
    const score = priorityDensity(task)
    const largestSlotHours = slots.reduce(
      (max, slot) =>
        Math.max(max, (slot.endMs - slot.cursorMs) / 3_600_000),
      0,
    )

    // Truly oversized: longer than all remaining free time combined.
    if (task.estimatedHours > remainingHours(slots) + 1e-9) {
      // Still place what we can via splitting, then delay the rest.
      const placed = placeTask(task, slots, {
        mode: "serenity",
        orderRank,
        score,
        referenceMs,
        allowSplit: true,
      })
      blocks.push(...placed.blocks)
      pending.delete(task.id)
      if (placed.blocks.length === 0) {
        excluded.push(defer(task, "serenity", "excluded"))
      } else if (placed.remainingHours > 1e-9) {
        delayed.push(defer(task, "serenity", "delayed"))
        // Partial work does not unlock dependents.
      } else {
        completed.add(task.id)
      }
      continue
    }

    // If it cannot fit even the first chunk into any remaining slot, exclude.
    if (largestSlotHours <= 1e-9) {
      excluded.push(defer(task, "serenity", "excluded"))
      pending.delete(task.id)
      continue
    }

    const placed = placeTask(task, slots, {
      mode: "serenity",
      orderRank,
      score,
      referenceMs,
      allowSplit: true,
    })
    blocks.push(...placed.blocks)
    pending.delete(task.id)

    if (placed.blocks.length === 0) {
      excluded.push(defer(task, "serenity", "excluded"))
    } else if (placed.remainingHours > 1e-9) {
      delayed.push(defer(task, "serenity", "delayed"))
    } else {
      completed.add(task.id)
    }
  }

  blocks.sort((a, b) => Date.parse(a.start) - Date.parse(b.start))

  return {
    mode: "serenity",
    blocks,
    delayed,
    excluded,
  }
}
