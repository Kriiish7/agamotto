import { v } from "convex/values"
import { internalMutation, mutation } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import type { MutationCtx } from "./_generated/server"

/**
 * Reminder / notification stubs for Agamotto.
 *
 * Does not call into schedule generation (Track 4a owns that). Reads
 * `scheduleBlocks` / `tasks` only to decide what would be emailed.
 *
 * TODO(email): wire a real provider (Resend / Postmark / SES) behind
 * `sendEmailStub` — keep the payload shape stable when swapping.
 */

/** Lookahead window for "upcoming block" reminders. */
const UPCOMING_WINDOW_MS = 60 * 60 * 1000 // 1 hour

export type EmailPayload = {
  to: string
  subject: string
  body: string
  /** Optional structured metadata for logging / future templates. */
  meta?: Record<string, unknown>
}

/**
 * Stubbed email interface — logs and returns the payload; no SMTP.
 * TODO(email): replace body with provider SDK send; keep signature.
 */
export async function sendEmailStub(
  payload: EmailPayload,
): Promise<{ ok: true; payload: EmailPayload }> {
  console.log("[notifications:email-stub]", JSON.stringify(payload))
  return { ok: true, payload }
}

type ReminderKind = "upcoming_block" | "overdue_task"

type ReminderDraft = {
  kind: ReminderKind
  userId: Id<"users">
  email: string
  subject: string
  body: string
  meta: Record<string, unknown>
}

async function collectReminderDrafts(
  ctx: MutationCtx,
  now: number,
): Promise<ReminderDraft[]> {
  const windowEnd = now + UPCOMING_WINDOW_MS
  const users = await ctx.db.query("users").collect()
  const drafts: ReminderDraft[] = []

  for (const user of users) {
    // Upcoming planned blocks starting within the next hour.
    const blocks = await ctx.db
      .query("scheduleBlocks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()

    for (const block of blocks) {
      if (block.status !== "planned") continue
      if (block.start < now || block.start > windowEnd) continue

      const task = await ctx.db.get(block.taskId)
      drafts.push({
        kind: "upcoming_block",
        userId: user._id,
        email: user.email,
        subject: `Upcoming: ${task?.title ?? "scheduled block"}`,
        body: `You have a block starting soon (${new Date(block.start).toISOString()}–${new Date(block.end).toISOString()}).`,
        meta: {
          blockId: block._id,
          taskId: block.taskId,
          scheduleId: block.scheduleId,
          start: block.start,
          end: block.end,
        },
      })
    }

    // Overdue: open tasks past deadline (not done/cancelled).
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()

    for (const task of tasks) {
      if (task.deadline === undefined) continue
      if (task.deadline >= now) continue
      if (task.status === "done" || task.status === "cancelled") continue

      drafts.push({
        kind: "overdue_task",
        userId: user._id,
        email: user.email,
        subject: `Overdue: ${task.title}`,
        body: `Task "${task.title}" was due ${new Date(task.deadline).toISOString()} and is still ${task.status}.`,
        meta: {
          taskId: task._id,
          deadline: task.deadline,
          status: task.status,
        },
      })
    }
  }

  return drafts
}

async function runReminderPass(ctx: MutationCtx, now: number) {
  const drafts = await collectReminderDrafts(ctx, now)
  const sent: Array<{ kind: ReminderKind; to: string; subject: string }> = []

  for (const draft of drafts) {
    const result = await sendEmailStub({
      to: draft.email,
      subject: draft.subject,
      body: draft.body,
      meta: { kind: draft.kind, userId: draft.userId, ...draft.meta },
    })
    sent.push({
      kind: draft.kind,
      to: result.payload.to,
      subject: result.payload.subject,
    })
  }

  return {
    checkedAt: now,
    reminderCount: drafts.length,
    sent,
  }
}

/**
 * Scan for upcoming schedule blocks and overdue open tasks, then stub-send
 * reminder emails. Invoked by the Convex cron in `crons.ts`.
 */
export const checkReminders = internalMutation({
  args: {
    /** Optional override for tests; defaults to Date.now(). */
    now: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await runReminderPass(ctx, args.now ?? Date.now())
  },
})

/**
 * Manual trigger for local/dev runs:
 *   npx convex run notifications:runReminderCheck
 *
 * TODO(auth): restrict to admin / internal once auth lands.
 */
export const runReminderCheck = mutation({
  args: {
    now: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await runReminderPass(ctx, args.now ?? Date.now())
  },
})
