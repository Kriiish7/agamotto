import { internalMutation } from "./_generated/server"
import type { Id } from "./_generated/dataModel"

/**
 * Dev seed: one test user, 10 varied tasks (some overloaded for Crunch),
 * and stub correctionFactors at 1.0.
 *
 * Internal-only so the public Convex API cannot mint users/tasks. CLI still
 * works (Convex allows `npx convex run` on internal functions):
 *   npx convex run seed:seedDemo
 *
 * Copy the returned `userId` into the dashboard demo-user strip (localStorage
 * key `agamotto.convex-user-id`).
 *
 * Re-running creates another user+tasks set (idempotent wipe is intentionally
 * omitted so parallel tracks can keep their own seed rows if needed).
 */

const DAY = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
} as const

/** Standard Mon–Fri 09:00–17:00 plus a short Sat morning window. */
const REALISTIC_WORKING_HOURS = [
  { dayOfWeek: DAY.Mon, startMinutes: 9 * 60, endMinutes: 17 * 60 },
  { dayOfWeek: DAY.Tue, startMinutes: 9 * 60, endMinutes: 17 * 60 },
  { dayOfWeek: DAY.Wed, startMinutes: 9 * 60, endMinutes: 17 * 60 },
  { dayOfWeek: DAY.Thu, startMinutes: 9 * 60, endMinutes: 17 * 60 },
  { dayOfWeek: DAY.Fri, startMinutes: 9 * 60, endMinutes: 17 * 60 },
  { dayOfWeek: DAY.Sat, startMinutes: 10 * 60, endMinutes: 13 * 60 },
]

type SeedTask = {
  title: string
  durationMinutes: number
  priority: number
  deadlineOffsetDays: number | null
  category: string
  status:
    | "inbox"
    | "ready"
    | "scheduled"
    | "in_progress"
    | "done"
    | "cancelled"
  /** Index into the same seed batch that this task depends on (if any). */
  dependsOnIndexes: number[]
}

/**
 * ~40h of Mon–Fri capacity/week; these sum far past that in the near window
 * so a Crunch-mode packer has work to do.
 */
const SEED_TASKS: SeedTask[] = [
  {
    title: "Draft Q3 planning brief",
    durationMinutes: 90,
    priority: 4,
    deadlineOffsetDays: 2,
    category: "planning",
    status: "ready",
    dependsOnIndexes: [],
  },
  {
    title: "Review competitor pricing scrape",
    durationMinutes: 60,
    priority: 3,
    deadlineOffsetDays: 3,
    category: "research",
    status: "ready",
    dependsOnIndexes: [],
  },
  {
    title: "Implement auth callback edge cases",
    durationMinutes: 240,
    priority: 5,
    deadlineOffsetDays: 4,
    category: "engineering",
    status: "ready",
    dependsOnIndexes: [],
  },
  {
    title: "Write integration tests for auth",
    durationMinutes: 180,
    priority: 4,
    deadlineOffsetDays: 5,
    category: "engineering",
    status: "inbox",
    dependsOnIndexes: [2],
  },
  {
    title: "Customer interview synthesis (8 calls)",
    durationMinutes: 300,
    priority: 3,
    deadlineOffsetDays: 6,
    category: "research",
    status: "ready",
    dependsOnIndexes: [],
  },
  {
    title: "Migrate billing webhooks to v2",
    durationMinutes: 360,
    priority: 5,
    deadlineOffsetDays: 3,
    category: "engineering",
    status: "ready",
    dependsOnIndexes: [],
  },
  {
    title: "Design crunch-mode capacity chart",
    durationMinutes: 120,
    priority: 2,
    deadlineOffsetDays: 7,
    category: "design",
    status: "inbox",
    dependsOnIndexes: [],
  },
  {
    title: "Ship onboarding email sequence",
    durationMinutes: 210,
    priority: 4,
    deadlineOffsetDays: 2,
    category: "growth",
    status: "ready",
    dependsOnIndexes: [],
  },
  {
    title: "Deep-clean backlog triage (oversized)",
    durationMinutes: 480,
    priority: 2,
    deadlineOffsetDays: 4,
    category: "ops",
    status: "ready",
    dependsOnIndexes: [],
  },
  {
    title: "Prepare board deck + appendix",
    durationMinutes: 420,
    priority: 5,
    deadlineOffsetDays: 1,
    category: "planning",
    status: "ready",
    dependsOnIndexes: [0],
  },
]

export const seedDemo = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000

    const userId = await ctx.db.insert("users", {
      name: "Ada Lovelace",
      email: "ada@agamotto.dev",
      workingHours: REALISTIC_WORKING_HOURS,
      timezone: "Europe/London",
      createdAt: now,
      updatedAt: now,
    })

    const taskIds: Id<"tasks">[] = []

    for (const spec of SEED_TASKS) {
      const dependsOn = spec.dependsOnIndexes.map((i) => {
        const id = taskIds[i]
        if (!id) {
          throw new Error(
            `dependsOn index ${i} resolved before that task was inserted`,
          )
        }
        return id
      })

      const taskId = await ctx.db.insert("tasks", {
        userId,
        title: spec.title,
        durationMinutes: spec.durationMinutes,
        priority: spec.priority,
        deadline:
          spec.deadlineOffsetDays === null
            ? undefined
            : now + spec.deadlineOffsetDays * dayMs,
        category: spec.category,
        status: spec.status,
        dependsOn,
        createdAt: now,
        updatedAt: now,
      })
      taskIds.push(taskId)
    }

    // User-wide default factor.
    await ctx.db.insert("correctionFactors", {
      userId,
      factor: 1.0,
      updatedAt: now,
    })

    // Per-task stubs (flat 1.0) so Phase 4 can overwrite without schema churn.
    for (const taskId of taskIds) {
      await ctx.db.insert("correctionFactors", {
        userId,
        taskId,
        factor: 1.0,
        updatedAt: now,
      })
    }

    const totalMinutes = SEED_TASKS.reduce(
      (sum, t) => sum + t.durationMinutes,
      0,
    )

    return {
      userId,
      taskIds,
      taskCount: taskIds.length,
      totalDurationMinutes: totalMinutes,
      correctionFactorCount: 1 + taskIds.length,
    }
  },
})
