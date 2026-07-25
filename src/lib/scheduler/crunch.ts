import {
  compareEdf,
  crunchScore,
  defer,
  dependencyTitles,
  depsSatisfied,
  placeTask,
  remainingHours,
  taskById,
  toMutableSlots,
} from "./placement"
import type { Block, DeferredTask, ScheduleResult, Task, Window } from "./types"

const MINUTES_PER_HOUR = 60

function toMinutes(hours: number): number {
  return Math.max(1, Math.round(hours * MINUTES_PER_HOUR))
}

/**
 * Classic 0/1 knapsack DP. Weights/values are positive integers.
 * Returns the set of selected item indices into `items`.
 */
export function knapsackSelect(
  items: ReadonlyArray<{ weight: number; value: number }>,
  capacity: number,
): number[] {
  const n = items.length
  const W = Math.max(0, Math.floor(capacity))
  if (n === 0 || W <= 0) return []

  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: W + 1 }, () => 0),
  )

  for (let i = 1; i <= n; i += 1) {
    const { weight, value } = items[i - 1]!
    for (let w = 0; w <= W; w += 1) {
      dp[i]![w] = dp[i - 1]![w]!
      if (weight <= w) {
        dp[i]![w] = Math.max(dp[i]![w]!, dp[i - 1]![w - weight]! + value)
      }
    }
  }

  const selected: number[] = []
  let w = W
  for (let i = n; i >= 1; i -= 1) {
    if (dp[i]![w] !== dp[i - 1]![w]) {
      selected.push(i - 1)
      w -= items[i - 1]!.weight
    }
  }
  selected.reverse()
  return selected
}

function transitiveDeps(taskId: string, byId: Map<string, Task>): string[] {
  const result: string[] = []
  const seen = new Set<string>()
  const stack = [...(byId.get(taskId)?.dependsOn ?? [])]
  while (stack.length > 0) {
    const id = stack.pop()!
    if (seen.has(id)) continue
    seen.add(id)
    result.push(id)
    const task = byId.get(id)
    if (task?.dependsOn) stack.push(...task.dependsOn)
  }
  return result
}

/**
 * Close a selected set under dependencies. Missing/excluded deps are blockers:
 * dependents that need them are dropped from the plan (never scheduled alone).
 * If the closure exceeds capacity, drop lowest-value leaves (never a required dep).
 */
function closeUnderDependencies(
  selectedIds: Set<string>,
  candidates: readonly Task[],
  byId: Map<string, Task>,
  capacityMinutes: number,
  referenceMs: number,
): Set<string> {
  const candidateIds = new Set(candidates.map((t) => t.id))
  const closed = new Set<string>()
  for (const id of selectedIds) {
    if (candidateIds.has(id)) closed.add(id)
  }

  // Drop dependents whose transitive deps are not all candidates (oversized,
  // never present, etc.). Do not silently ignore missing deps.
  const depsAvailable = (id: string) =>
    transitiveDeps(id, byId).every((depId) => candidateIds.has(depId))

  for (const id of [...closed]) {
    if (!depsAvailable(id)) closed.delete(id)
  }

  // Add every available transitive dependency into the closed set.
  for (const id of [...closed]) {
    for (const depId of transitiveDeps(id, byId)) {
      if (candidateIds.has(depId)) closed.add(depId)
    }
  }

  const weightOf = (id: string) =>
    toMinutes(byId.get(id)?.estimatedHours ?? 0)

  let total = [...closed].reduce((sum, id) => sum + weightOf(id), 0)
  if (total <= capacityMinutes) return closed

  // Drop optional selected tasks by ascending crunch score until fit.
  const dropOrder = [...closed]
    .filter((id) => {
      // Keep if some other closed task depends on it.
      return ![...closed].some((other) =>
        transitiveDeps(other, byId).includes(id),
      )
    })
    .sort(
      (a, b) =>
        crunchScore(byId.get(a)!, referenceMs) -
        crunchScore(byId.get(b)!, referenceMs),
    )

  for (const id of dropOrder) {
    if (total <= capacityMinutes) break
    // Only drop if nothing remaining depends on it.
    const stillNeeded = [...closed].some(
      (other) => other !== id && transitiveDeps(other, byId).includes(id),
    )
    if (stillNeeded) continue
    closed.delete(id)
    total -= weightOf(id)
  }

  // After capacity drops, cascade-remove anything whose deps left the set.
  let changed = true
  while (changed) {
    changed = false
    for (const id of [...closed]) {
      const missing = transitiveDeps(id, byId).some((depId) => !closed.has(depId))
      if (missing) {
        closed.delete(id)
        changed = true
      }
    }
  }

  return closed
}

/**
 * Crunch: 0/1 knapsack under the time budget, EDF order, greedy placement.
 * Remainder is delayed or excluded.
 */
export function scheduleCrunch(
  tasks: readonly Task[],
  windows: readonly Window[],
): ScheduleResult {
  const slots = toMutableSlots(windows)
  const byId = taskById(tasks)
  const referenceMs = slots[0]?.cursorMs ?? Date.now()
  const capacityHours = remainingHours(slots)
  const capacityMinutes = Math.floor(capacityHours * MINUTES_PER_HOUR)

  const blocks: Block[] = []
  const delayed: DeferredTask[] = []
  const excluded: DeferredTask[] = []

  if (capacityMinutes <= 0) {
    for (const task of tasks) {
      excluded.push(defer(task, "crunch", "excluded"))
    }
    return { mode: "crunch", blocks, delayed, excluded }
  }

  // Tasks larger than the entire budget can never be selected.
  const candidates: Task[] = []
  for (const task of tasks) {
    if (toMinutes(task.estimatedHours) > capacityMinutes) {
      excluded.push(defer(task, "crunch", "excluded"))
    } else {
      candidates.push(task)
    }
  }

  const items = candidates.map((task) => ({
    weight: toMinutes(task.estimatedHours),
    value: Math.max(
      1,
      Math.round(crunchScore(task, referenceMs) * 100),
    ),
  }))

  const selectedIdx = knapsackSelect(items, capacityMinutes)
  let selected = new Set(selectedIdx.map((i) => candidates[i]!.id))
  selected = closeUnderDependencies(
    selected,
    candidates,
    byId,
    capacityMinutes,
    referenceMs,
  )

  // Remainder of candidates → delayed, or excluded when deps are not on the plan.
  for (const task of candidates) {
    if (selected.has(task.id)) continue
    const unmetDepIds = (task.dependsOn ?? []).filter(
      (depId) => !selected.has(depId),
    )
    if (unmetDepIds.length > 0) {
      const titles = unmetDepIds.map(
        (id) => byId.get(id)?.title ?? id,
      )
      excluded.push(defer(task, "crunch", "excluded", titles))
    } else {
      delayed.push(defer(task, "crunch", "delayed"))
    }
  }

  // EDF order among selected; deps must be completed in-plan (never skip).
  const selectedTasks = candidates.filter((t) => selected.has(t.id))
  const pending = new Set(selectedTasks.map((t) => t.id))
  const completed = new Set<string>()
  let orderRank = 0

  while (pending.size > 0) {
    const ready = [...pending]
      .map((id) => byId.get(id))
      .filter((task): task is Task => !!task && depsSatisfied(task, completed))

    if (ready.length === 0) {
      for (const id of pending) {
        const task = byId.get(id)!
        excluded.push(
          defer(task, "crunch", "excluded", dependencyTitles(task, byId)),
        )
      }
      break
    }

    ready.sort(compareEdf)
    const task = ready[0]!
    orderRank += 1
    const score = crunchScore(task, referenceMs)

    const placed = placeTask(task, slots, {
      mode: "crunch",
      orderRank,
      score,
      referenceMs,
      allowSplit: true,
    })
    blocks.push(...placed.blocks)
    pending.delete(task.id)

    if (placed.blocks.length === 0 || placed.remainingHours > 1e-9) {
      // Rare after knapsack; treat as delayed remainder or exclude.
      if (placed.blocks.length === 0) {
        excluded.push(defer(task, "crunch", "excluded"))
      } else {
        delayed.push(defer(task, "crunch", "delayed"))
      }
    } else {
      completed.add(task.id)
    }
  }

  blocks.sort((a, b) => Date.parse(a.start) - Date.parse(b.start))

  return {
    mode: "crunch",
    blocks,
    delayed,
    excluded,
  }
}
