import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"

import {
  CancelTaskDialog,
  DemoUserSetup,
  EditTaskDialog,
  QuickAddBar,
  TaskTable,
  useDemoUserId,
} from "@/components/tasks"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth"
import { api } from "../../../convex/_generated/api"
import type { Doc } from "../../../convex/_generated/dataModel"
import type { ParsedTaskInput } from "@/components/tasks"
import {
  STATUS_LABEL,
  TASK_STATUSES,
  type TaskStatus,
} from "@/components/tasks/task-labels"

export const Route = createFileRoute("/dashboard/tasks")({
  component: TasksPage,
})

type StatusFilter = "all" | "active" | TaskStatus

function TasksPage() {
  const { user } = useAuth()
  const { userId, setUserId, ready } = useDemoUserId()
  const [statusFilter, setStatusFilter] =
    React.useState<StatusFilter>("active")
  const [editing, setEditing] = React.useState<Doc<"tasks"> | null>(null)
  const [cancelling, setCancelling] = React.useState<Doc<"tasks"> | null>(null)

  const listArgs =
    userId == null
      ? "skip"
      : statusFilter !== "all" && statusFilter !== "active"
        ? { userId, status: statusFilter }
        : { userId }

  const tasks = useQuery(
    api.tasks.list,
    listArgs === "skip" ? "skip" : listArgs,
  )
  const createTask = useMutation(api.tasks.create)
  const updateTask = useMutation(api.tasks.update)
  const cancelTask = useMutation(api.tasks.cancel)

  const visibleTasks = React.useMemo(() => {
    if (!tasks) return []
    const sorted = [...tasks].sort((a, b) => b.updatedAt - a.updatedAt)
    if (statusFilter === "active") {
      return sorted.filter((t) => t.status !== "cancelled" && t.status !== "done")
    }
    return sorted
  }, [tasks, statusFilter])

  async function handleQuickAdd(parsed: ParsedTaskInput) {
    if (!userId) throw new Error("Set a Convex userId first")
    await createTask({
      userId,
      title: parsed.title,
      durationMinutes: parsed.durationMinutes,
      priority: parsed.priority,
      deadline: parsed.deadline,
      category: parsed.category,
      status: "inbox",
    })
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-medium tracking-tight">Tasks</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Quick-add with light natural-language heuristics, then edit or
          soft-cancel. Signed in as{" "}
          <span className="text-foreground">{user?.name ?? "guest"}</span>
          {user?.email ? (
            <>
              {" "}
              (<span className="font-mono text-xs">{user.email}</span>)
            </>
          ) : null}
          .
        </p>
      </div>

      {ready ? (
        <DemoUserSetup
          userId={userId}
          onSave={setUserId}
          onClear={() => setUserId(null)}
        />
      ) : null}

      <QuickAddBar disabled={!userId} onSubmit={handleQuickAdd} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-medium">Your tasks</h2>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            if (v != null) setStatusFilter(v as StatusFilter)
          }}
          disabled={!userId}
        >
          <SelectTrigger size="sm" className="w-44">
            <SelectValue>
              {(value) => {
                if (value === "active") return "Active"
                if (value === "all") return "All"
                if (typeof value === "string" && value in STATUS_LABEL) {
                  return STATUS_LABEL[value as TaskStatus]
                }
                return "Filter"
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="all">All</SelectItem>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!userId ? (
        <p className="text-sm text-muted-foreground">
          Paste a seeded Convex userId above to load tasks.
        </p>
      ) : tasks === undefined ? (
        <p className="text-sm text-muted-foreground">Loading tasks…</p>
      ) : (
        <TaskTable
          tasks={visibleTasks}
          onEdit={setEditing}
          onCancel={setCancelling}
        />
      )}

      <EditTaskDialog
        task={editing}
        open={editing != null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        onSave={async (patch) => {
          if (!userId || !editing) return
          await updateTask({
            userId,
            taskId: editing._id,
            ...patch,
          })
        }}
      />

      <CancelTaskDialog
        task={cancelling}
        open={cancelling != null}
        onOpenChange={(open) => {
          if (!open) setCancelling(null)
        }}
        onConfirm={async () => {
          if (!userId || !cancelling) return
          await cancelTask({ userId, taskId: cancelling._id })
        }}
      />
    </section>
  )
}
