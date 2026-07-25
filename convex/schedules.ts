import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import type { MutationCtx, QueryCtx } from "./_generated/server"
import type { Doc, Id } from "./_generated/dataModel"
import { schedule } from "./schedulerBridge"
import type { Block } from "./schedulerBridge"
import {
  buildAvailabilityWindows,
  isFixedBlock,
  isSchedulableTask,
  parseTaskId,
  remainingMinutesForTask,
  subtractOccupiedFromWindows,
  toSchedulerTask,
} from "./lib/scheduleHelpers"

/**
 * TODO(auth): Track C stubbed auth — accept explicit userId until
 * Convex auth / identity is wired. Prefer ctx.auth.getUserIdentity() then.
 */

const scheduleBlockStatus = v.union(
  v.literal("planned"),
  v.literal("completed"),
  v.literal("skipped"),
  v.literal("moved"),
)

type DeferredItem = {
  taskId: string
  title: string
  reason: string
}

type DbCtx = MutationCtx | QueryCtx

function normalizeDeferred(
  items: readonly DeferredItem[] | undefined,
): DeferredItem[] {
  return items ? [...items] : []
}

async function requireUser(
  ctx: DbCtx,
  userId: Id<"users">,
): Promise<Doc<"users">> {
  const user = await ctx.db.get(userId)
  if (!user) {
    throw new Error(`User not found: ${userId}`)
  }
  return user
}

async function loadSchedulableTasks(
  ctx: DbCtx,
  userId: Id<"users">,
): Promise<Doc<"tasks">[]> {
  const tasks = await ctx.db
    .query("tasks")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect()
  return tasks.filter(isSchedulableTask)
}

async function supersedeOverlappingActiveSchedules(
  ctx: MutationCtx,
  userId: Id<"users">,
  rangeStart: number,
  rangeEnd: number,
): Promise<void> {
  const active = await ctx.db
    .query("schedules")
    .withIndex("by_user_status", (q) =>
      q.eq("userId", userId).eq("status", "active"),
    )
    .collect()

  for (const existing of active) {
    const overlaps =
      existing.rangeStart <= rangeEnd && existing.rangeEnd >= rangeStart
    if (overlaps) {
      await ctx.db.patch(existing._id, { status: "superseded" })
    }
  }
}

async function insertBlocksFromResult(
  ctx: MutationCtx,
  args: {
    scheduleId: Id<"schedules">
    userId: Id<"users">
    blocks: readonly Block[]
  },
): Promise<Id<"scheduleBlocks">[]> {
  const ids: Id<"scheduleBlocks">[] = []
  for (const block of args.blocks) {
    const id = await ctx.db.insert("scheduleBlocks", {
      scheduleId: args.scheduleId,
      userId: args.userId,
      taskId: parseTaskId(block.taskId),
      start: Date.parse(block.start),
      end: Date.parse(block.end),
      status: "planned",
      explanation: block.explanation,
      isManualOverride: false,
    })
    ids.push(id)
  }
  return ids
}

/** Load a schedule with its blocks (ordered by start). */
export const getSchedule = query({
  args: {
    // TODO(auth): derive from identity once auth is real
    userId: v.id("users"),
    scheduleId: v.id("schedules"),
  },
  handler: async (ctx, args) => {
    const scheduleDoc = await ctx.db.get(args.scheduleId)
    if (!scheduleDoc || scheduleDoc.userId !== args.userId) {
      return null
    }
    const blocks = await ctx.db
      .query("scheduleBlocks")
      .withIndex("by_schedule_start", (q) =>
        q.eq("scheduleId", args.scheduleId),
      )
      .collect()
    return {
      schedule: scheduleDoc,
      blocks,
      delayed: normalizeDeferred(scheduleDoc.delayed),
      excluded: normalizeDeferred(scheduleDoc.excluded),
    }
  },
})

/** List schedules for a user (newest generation first). */
export const listSchedules = query({
  args: {
    // TODO(auth): derive from identity once auth is real
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const schedules = await ctx.db
      .query("schedules")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()
    return schedules.sort((a, b) => b.generatedAt - a.generatedAt)
  },
})

/**
 * Generate a fresh schedule for [rangeStart, rangeEnd] using the user's
 * working hours + schedulable tasks. Mode is auto-selected (serenity/crunch).
 */
export const generateSchedule = mutation({
  args: {
    // TODO(auth): derive from identity once auth is real
    userId: v.id("users"),
    rangeStart: v.number(),
    rangeEnd: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.rangeEnd < args.rangeStart) {
      throw new Error("rangeEnd must be >= rangeStart")
    }

    const user = await requireUser(ctx, args.userId)
    const taskDocs = await loadSchedulableTasks(ctx, args.userId)
    const windows = buildAvailabilityWindows(
      user.workingHours,
      args.rangeStart,
      args.rangeEnd,
      user.timezone,
    )
    const tasks = taskDocs.map((t) => toSchedulerTask(t))

    const result = schedule(tasks, windows)

    await supersedeOverlappingActiveSchedules(
      ctx,
      args.userId,
      args.rangeStart,
      args.rangeEnd,
    )

    const now = Date.now()
    const delayed = normalizeDeferred(result.delayed)
    const excluded = normalizeDeferred(result.excluded)
    const scheduleId = await ctx.db.insert("schedules", {
      userId: args.userId,
      rangeStart: args.rangeStart,
      rangeEnd: args.rangeEnd,
      mode: result.mode,
      generatedAt: now,
      status: "active",
      delayed,
      excluded,
    })

    const blockIds = await insertBlocksFromResult(ctx, {
      scheduleId,
      userId: args.userId,
      blocks: result.blocks,
    })

    return {
      scheduleId,
      mode: result.mode,
      blockIds,
      blockCount: blockIds.length,
      delayed,
      excluded,
    }
  },
})

/**
 * Re-pack incomplete, non-overridden blocks on an existing schedule.
 * Manual overrides (`isManualOverride: true`) stay fixed; the packer
 * schedules around their occupied intervals. Completed/skipped/moved
 * blocks are also left alone.
 */
export const rescheduleIncomplete = mutation({
  args: {
    // TODO(auth): derive from identity once auth is real
    userId: v.id("users"),
    scheduleId: v.id("schedules"),
  },
  handler: async (ctx, args) => {
    const scheduleDoc = await ctx.db.get(args.scheduleId)
    if (!scheduleDoc || scheduleDoc.userId !== args.userId) {
      throw new Error("Schedule not found for user")
    }

    const user = await requireUser(ctx, args.userId)
    const existingBlocks = await ctx.db
      .query("scheduleBlocks")
      .withIndex("by_schedule", (q) => q.eq("scheduleId", args.scheduleId))
      .collect()

    const keptBlocks = existingBlocks.filter(isFixedBlock)
    const regeneratable = existingBlocks.filter((b) => !isFixedBlock(b))

    for (const block of regeneratable) {
      await ctx.db.delete(block._id)
    }

    const taskDocs = await loadSchedulableTasks(ctx, args.userId)
    const tasksToPlace = taskDocs
      .map((task) => {
        const remaining = remainingMinutesForTask(task, keptBlocks)
        if (remaining <= 1e-6) return null
        return toSchedulerTask(task, remaining)
      })
      .filter((t): t is NonNullable<typeof t> => t !== null)

    const baseWindows = buildAvailabilityWindows(
      user.workingHours,
      scheduleDoc.rangeStart,
      scheduleDoc.rangeEnd,
      user.timezone,
    )
    const freeWindows = subtractOccupiedFromWindows(
      baseWindows,
      keptBlocks.map((b) => ({ start: b.start, end: b.end })),
    )

    const result = schedule(tasksToPlace, freeWindows)
    const delayed = normalizeDeferred(result.delayed)
    const excluded = normalizeDeferred(result.excluded)

    const blockIds = await insertBlocksFromResult(ctx, {
      scheduleId: args.scheduleId,
      userId: args.userId,
      blocks: result.blocks,
    })

    // Mode / deferred may change after overrides carve capacity — persist both.
    await ctx.db.patch(args.scheduleId, {
      mode: result.mode,
      generatedAt: Date.now(),
      status: "active",
      delayed,
      excluded,
    })

    return {
      scheduleId: args.scheduleId,
      mode: result.mode,
      keptOverrideCount: keptBlocks.filter((b) => b.isManualOverride).length,
      keptFixedCount: keptBlocks.length,
      removedCount: regeneratable.length,
      blockIds,
      blockCount: blockIds.length,
      delayed,
      excluded,
    }
  },
})

/**
 * Manually move or update a block. Sets `isManualOverride: true` so future
 * regenerations leave it fixed and schedule around it.
 */
export const overrideBlock = mutation({
  args: {
    // TODO(auth): derive from identity once auth is real
    userId: v.id("users"),
    blockId: v.id("scheduleBlocks"),
    start: v.optional(v.number()),
    end: v.optional(v.number()),
    status: v.optional(scheduleBlockStatus),
  },
  handler: async (ctx, args) => {
    const block = await ctx.db.get(args.blockId)
    if (!block || block.userId !== args.userId) {
      throw new Error("Schedule block not found for user")
    }

    if (
      args.start === undefined &&
      args.end === undefined &&
      args.status === undefined
    ) {
      throw new Error("Provide start, end, and/or status to override")
    }

    const nextStart = args.start ?? block.start
    const nextEnd = args.end ?? block.end
    if (nextEnd <= nextStart) {
      throw new Error("Block end must be after start")
    }

    const nextStatus = args.status ?? block.status
    const explanation = block.explanation.includes("[manual override]")
      ? block.explanation
      : `${block.explanation} [manual override]`

    await ctx.db.patch(args.blockId, {
      start: nextStart,
      end: nextEnd,
      status: nextStatus,
      isManualOverride: true,
      explanation,
    })

    return {
      blockId: args.blockId,
      start: nextStart,
      end: nextEnd,
      status: nextStatus,
      isManualOverride: true as const,
      explanation,
    }
  },
})
