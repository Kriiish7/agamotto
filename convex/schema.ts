import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

/** Minutes from midnight (0–1440). */
const minutesOfDay = v.number()

/** 0 = Sunday … 6 = Saturday (JS Date.getDay()). */
const dayOfWeek = v.number()

/** One contiguous working window on a weekday. */
const workingHourWindow = v.object({
  dayOfWeek,
  startMinutes: minutesOfDay,
  endMinutes: minutesOfDay,
})

const taskStatus = v.union(
  v.literal("inbox"),
  v.literal("ready"),
  v.literal("scheduled"),
  v.literal("in_progress"),
  v.literal("done"),
  v.literal("cancelled"),
)

const scheduleMode = v.union(v.literal("serenity"), v.literal("crunch"))

const scheduleStatus = v.union(
  v.literal("draft"),
  v.literal("active"),
  v.literal("superseded"),
  v.literal("archived"),
)

const scheduleBlockStatus = v.union(
  v.literal("planned"),
  v.literal("completed"),
  v.literal("skipped"),
  v.literal("moved"),
)

/**
 * Agamotto domain schema.
 *
 * Indexes are keyed by userId (and schedule/task where list queries need them)
 * so scheduler + UI tracks can fan out without full-table scans.
 */
export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    /** Per-day working windows; multiple windows per day are allowed. */
    workingHours: v.array(workingHourWindow),
    timezone: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),

  tasks: defineTable({
    userId: v.id("users"),
    title: v.string(),
    /** Estimated duration in minutes. */
    durationMinutes: v.number(),
    /** Higher = more important (1–5). */
    priority: v.number(),
    /** Absolute deadline as unix ms; omit when open-ended. */
    deadline: v.optional(v.number()),
    category: v.string(),
    status: taskStatus,
    /** Task IDs that must complete before this one may be scheduled. */
    dependsOn: v.array(v.id("tasks")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_user_deadline", ["userId", "deadline"]),

  /**
   * Append-only audit log. Phase 4 will write a row on every task mutation.
   * `snapshot` holds the post-change task fields; `change` is a short label.
   */
  taskHistory: defineTable({
    taskId: v.id("tasks"),
    userId: v.id("users"),
    change: v.string(),
    snapshot: v.any(),
    timestamp: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_user", ["userId"])
    .index("by_user_timestamp", ["userId", "timestamp"]),

  schedules: defineTable({
    userId: v.id("users"),
    /** Inclusive range start (unix ms, typically start-of-day in user TZ). */
    rangeStart: v.number(),
    /** Inclusive range end (unix ms). */
    rangeEnd: v.number(),
    mode: scheduleMode,
    generatedAt: v.number(),
    status: scheduleStatus,
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_user_range", ["userId", "rangeStart"]),

  scheduleBlocks: defineTable({
    scheduleId: v.id("schedules"),
    userId: v.id("users"),
    taskId: v.id("tasks"),
    start: v.number(),
    end: v.number(),
    status: scheduleBlockStatus,
    /** Human-readable reason the scheduler placed this block. */
    explanation: v.string(),
    isManualOverride: v.boolean(),
  })
    .index("by_schedule", ["scheduleId"])
    .index("by_user", ["userId"])
    .index("by_task", ["taskId"])
    .index("by_schedule_start", ["scheduleId", "start"]),

  /**
   * Duration (or effort) multipliers. v1 seeds flat 1.0 stubs;
   * taskId omitted = user-wide default factor.
   */
  correctionFactors: defineTable({
    userId: v.id("users"),
    taskId: v.optional(v.id("tasks")),
    factor: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_task", ["userId", "taskId"]),
})
