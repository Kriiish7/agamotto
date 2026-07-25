import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import type { Doc, Id } from "./_generated/dataModel"
import type { MutationCtx } from "./_generated/server"

/**
 * Task CRUD for Agamotto.
 *
 * Auth is stubbed via explicit `userId` args until Convex Auth is wired.
 * TODO(auth): replace userId args with `ctx.auth.getUserIdentity()` and map
 * to the internal `users` row.
 *
 * Invariant: every task write appends a `taskHistory` row (create/update/cancel).
 */

const taskStatus = v.union(
  v.literal("inbox"),
  v.literal("ready"),
  v.literal("scheduled"),
  v.literal("in_progress"),
  v.literal("done"),
  v.literal("cancelled"),
)

type TaskSnapshot = Omit<Doc<"tasks">, "_id" | "_creationTime"> & {
  _id?: Id<"tasks">
}

/** Append-only audit row. Called from every task write path — no exceptions. */
async function appendTaskHistory(
  ctx: MutationCtx,
  args: {
    taskId: Id<"tasks">
    userId: Id<"users">
    change: string
    snapshot: TaskSnapshot
  },
) {
  await ctx.db.insert("taskHistory", {
    taskId: args.taskId,
    userId: args.userId,
    change: args.change,
    snapshot: args.snapshot,
    timestamp: Date.now(),
  })
}

function assertPriority(priority: number) {
  if (!Number.isInteger(priority) || priority < 1 || priority > 5) {
    throw new Error("priority must be an integer from 1 to 5")
  }
}

function assertDuration(durationMinutes: number) {
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw new Error("durationMinutes must be a positive number")
  }
}

async function requireOwnedTask(
  ctx: MutationCtx,
  taskId: Id<"tasks">,
  userId: Id<"users">,
): Promise<Doc<"tasks">> {
  const task = await ctx.db.get(taskId)
  if (!task) {
    throw new Error("task not found")
  }
  if (task.userId !== userId) {
    throw new Error("task does not belong to user")
  }
  return task
}

/** Ensure every dependsOn id exists and is owned by the same user. */
async function assertDependsOnOwned(
  ctx: MutationCtx,
  userId: Id<"users">,
  dependsOn: Id<"tasks">[],
) {
  for (const depId of dependsOn) {
    const dep = await ctx.db.get(depId)
    if (!dep) {
      throw new Error("dependsOn task not found")
    }
    if (dep.userId !== userId) {
      throw new Error("dependsOn task does not belong to user")
    }
  }
}

/** Create a task and record history. */
export const create = mutation({
  args: {
    // TODO(auth): derive from Convex Auth identity instead of client arg
    userId: v.id("users"),
    title: v.string(),
    durationMinutes: v.number(),
    priority: v.number(),
    deadline: v.optional(v.number()),
    category: v.string(),
    status: v.optional(taskStatus),
    dependsOn: v.optional(v.array(v.id("tasks"))),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error("user not found")
    }

    const title = args.title.trim()
    if (!title) {
      throw new Error("title is required")
    }
    assertDuration(args.durationMinutes)
    assertPriority(args.priority)

    const now = Date.now()
    const status = args.status ?? "inbox"
    const dependsOn = args.dependsOn ?? []
    await assertDependsOnOwned(ctx, args.userId, dependsOn)

    const taskId = await ctx.db.insert("tasks", {
      userId: args.userId,
      title,
      durationMinutes: args.durationMinutes,
      priority: args.priority,
      deadline: args.deadline,
      category: args.category,
      status,
      dependsOn,
      createdAt: now,
      updatedAt: now,
    })

    const snapshot: TaskSnapshot = {
      userId: args.userId,
      title,
      durationMinutes: args.durationMinutes,
      priority: args.priority,
      deadline: args.deadline,
      category: args.category,
      status,
      dependsOn,
      createdAt: now,
      updatedAt: now,
      _id: taskId,
    }

    await appendTaskHistory(ctx, {
      taskId,
      userId: args.userId,
      change: "created",
      snapshot,
    })

    return taskId
  },
})

/** Patch task fields and record history. */
export const update = mutation({
  args: {
    // TODO(auth): derive from Convex Auth identity instead of client arg
    userId: v.id("users"),
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    durationMinutes: v.optional(v.number()),
    priority: v.optional(v.number()),
    deadline: v.optional(v.union(v.number(), v.null())),
    category: v.optional(v.string()),
    status: v.optional(taskStatus),
    dependsOn: v.optional(v.array(v.id("tasks"))),
  },
  handler: async (ctx, args) => {
    const existing = await requireOwnedTask(ctx, args.taskId, args.userId)

    if (args.durationMinutes !== undefined) {
      assertDuration(args.durationMinutes)
    }
    if (args.priority !== undefined) {
      assertPriority(args.priority)
    }
    if (args.dependsOn !== undefined) {
      await assertDependsOnOwned(ctx, args.userId, args.dependsOn)
    }

    const title =
      args.title !== undefined ? args.title.trim() : existing.title
    if (!title) {
      throw new Error("title is required")
    }

    const now = Date.now()
    const patch: Partial<Doc<"tasks">> = {
      updatedAt: now,
    }

    if (args.title !== undefined) patch.title = title
    if (args.durationMinutes !== undefined) {
      patch.durationMinutes = args.durationMinutes
    }
    if (args.priority !== undefined) patch.priority = args.priority
    if (args.category !== undefined) patch.category = args.category
    if (args.status !== undefined) patch.status = args.status
    if (args.dependsOn !== undefined) patch.dependsOn = args.dependsOn
    // null clears an open-ended deadline; omit leaves it unchanged
    if (args.deadline !== undefined) {
      patch.deadline = args.deadline === null ? undefined : args.deadline
    }

    await ctx.db.patch(args.taskId, patch)

    const updated = (await ctx.db.get(args.taskId))!
    await appendTaskHistory(ctx, {
      taskId: args.taskId,
      userId: args.userId,
      change: "updated",
      snapshot: { ...updated, _id: updated._id },
    })

    return updated._id
  },
})

async function softCancelTask(
  ctx: MutationCtx,
  userId: Id<"users">,
  taskId: Id<"tasks">,
) {
  const existing = await requireOwnedTask(ctx, taskId, userId)
  if (existing.status === "cancelled") {
    return taskId
  }

  const now = Date.now()
  await ctx.db.patch(taskId, {
    status: "cancelled",
    updatedAt: now,
  })

  const updated = (await ctx.db.get(taskId))!
  await appendTaskHistory(ctx, {
    taskId,
    userId,
    change: "cancelled",
    snapshot: { ...updated, _id: updated._id },
  })

  return taskId
}

/**
 * Soft-cancel a task (status → cancelled). Prefer this over hard delete so
 * schedule history and audit trails remain intact.
 */
export const cancel = mutation({
  args: {
    // TODO(auth): derive from Convex Auth identity instead of client arg
    userId: v.id("users"),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    return await softCancelTask(ctx, args.userId, args.taskId)
  },
})

/** Soft-delete alias — same as cancel (no hard deletes). */
export const remove = mutation({
  args: {
    // TODO(auth): derive from Convex Auth identity instead of client arg
    userId: v.id("users"),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    return await softCancelTask(ctx, args.userId, args.taskId)
  },
})

/** Get a single task owned by the user. */
export const get = query({
  args: {
    // TODO(auth): derive from Convex Auth identity instead of client arg
    userId: v.id("users"),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId)
    if (!task || task.userId !== args.userId) {
      return null
    }
    return task
  },
})

/** List tasks for a user, optionally filtered by status. */
export const list = query({
  args: {
    // TODO(auth): derive from Convex Auth identity instead of client arg
    userId: v.id("users"),
    status: v.optional(taskStatus),
  },
  handler: async (ctx, args) => {
    if (args.status !== undefined) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_user_status", (q) =>
          q.eq("userId", args.userId).eq("status", args.status!),
        )
        .collect()
    }

    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()
  },
})

/** List audit history for a task (newest first). */
export const listHistory = query({
  args: {
    // TODO(auth): derive from Convex Auth identity instead of client arg
    userId: v.id("users"),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId)
    if (!task || task.userId !== args.userId) {
      return []
    }

    const rows = await ctx.db
      .query("taskHistory")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect()

    return rows.sort((a, b) => b.timestamp - a.timestamp)
  },
})
