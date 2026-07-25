import type { SchedulerMode, Task } from "./types"

export type ExplainKind = "placed" | "split" | "delayed" | "excluded"

export type ExplainInput = {
  mode: SchedulerMode
  task: Task
  kind: ExplainKind
  /** 1-based rank in the ordering that drove placement. */
  orderRank?: number
  /** Priority-density (Serenity) or crunch score (Crunch). */
  score?: number
  sessionIndex?: number
  sessionCount?: number
  /** Hours from a reference "now" (window start) to the deadline. */
  hoursUntilDeadline?: number
  /** Titles of unmet or respected dependencies. */
  dependencyTitles?: string[]
}

function formatDeadline(hoursUntil?: number): string | null {
  if (hoursUntil === undefined || !Number.isFinite(hoursUntil)) {
    return null
  }
  if (hoursUntil <= 0) {
    return "its deadline is already due"
  }
  if (hoursUntil < 24) {
    const h = Math.max(1, Math.round(hoursUntil))
    return `its deadline is in about ${h} hour${h === 1 ? "" : "s"}`
  }
  const days = Math.max(1, Math.round(hoursUntil / 24))
  return `its deadline is in about ${days} day${days === 1 ? "" : "s"}`
}

function scorePhrase(mode: SchedulerMode, score?: number): string {
  if (score === undefined) {
    return mode === "serenity"
      ? "its priority-to-time score"
      : "its crunch value"
  }
  const rounded = Math.round(score * 100) / 100
  return mode === "serenity"
    ? `a priority-to-time score of ${rounded}`
    : `a crunch value of ${rounded}`
}

/**
 * Shared plain-language explanations for every scheduling decision.
 * Both Serenity and Crunch must call this — do not duplicate voice.
 */
export function explain(input: ExplainInput): string {
  const { mode, task, kind } = input
  const title = task.title.trim() || "This task"
  const deadline = formatDeadline(input.hoursUntilDeadline)
  const deps =
    input.dependencyTitles && input.dependencyTitles.length > 0
      ? input.dependencyTitles.join(", ")
      : null

  if (kind === "excluded") {
    if (deps) {
      return `"${title}" is left out because its dependencies (${deps}) never cleared a slot, so it cannot start.`
    }
    return `"${title}" cannot fit any available window — even split into sessions — so it needs a longer stretch of free time or a shorter estimate.`
  }

  if (kind === "delayed") {
    if (mode === "crunch") {
      return `"${title}" is delayed: Crunch kept higher-value work under today's time budget, and this task did not make the cut.`
    }
    if (deps) {
      const verb =
        (input.dependencyTitles?.length ?? 0) === 1 ? "is" : "are"
      return `"${title}" waits until ${deps} ${verb} finished — dependencies stay ahead of dependents.`
    }
    return `"${title}" waits for a later plan — today's free windows are already claimed by higher-scoring work.`
  }

  if (kind === "split") {
    const count = input.sessionCount ?? 2
    const index = input.sessionIndex ?? 1
    return `"${title}" is session ${index} of ${count}: split so the work fits your free windows without a marathon block.`
  }

  // kind === "placed"
  const rank = input.orderRank
  const scoreBit = scorePhrase(mode, input.score)
  const rankBit =
    rank === 1
      ? "it ranks first among ready tasks"
      : rank !== undefined
        ? `it ranks #${rank} among ready tasks`
        : "it ranks well among ready tasks"

  if (mode === "crunch") {
    if (deadline) {
      return `"${title}" is on the plan because ${deadline}, and ${scoreBit} earned it a seat in the Crunch budget.`
    }
    return `"${title}" is on the plan because ${scoreBit} earned it a seat in the Crunch budget${rank === 1 ? " — earliest among selected work" : ""}.`
  }

  if (deadline && rank === 1) {
    return `"${title}" is first: ${deadline} and ${scoreBit} put it ahead of the rest.`
  }
  if (deadline) {
    return `"${title}" lands here because ${rankBit}, ${deadline}, and ${scoreBit}.`
  }
  if (deps) {
    return `"${title}" starts after ${deps}, placed next because ${rankBit} with ${scoreBit}.`
  }
  return `"${title}" lands here because ${rankBit} with ${scoreBit}.`
}
