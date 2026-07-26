import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"

import { PageHeader } from "@/components/page-header"
import {
  CancelTaskDialog,
  DemoUserSetup,
  EditTaskDialog,
  QuickAddBar,
  TaskTable,
  useDemoUserId,
} from "@/components/tasks"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ListChecks } from "@phosphor-icons/react"
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
    <section className="flex flex-col gap-8">
      <PageHeader
        title="Tasks"
        description={
          <>
            Quick-add with light natural-language heuristics, then edit or
            soft-cancel
            {user?.name ? (
              <>
                {" "}
                · signed in as{" "}
                <span className="font-medium text-foreground">{user.name}</span>
              </>
            ) : null}
            .
          </>
        }
      />

      <QuickAddBar disabled={!userId} onSubmit={handleQuickAdd} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-sm font-medium">Your tasks</h2>
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
          <Empty className="border border-dashed border-border/80 bg-card/40">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ListChecks weight="duotone" />
              </EmptyMedia>
              <EmptyTitle>Connect a demo user</EmptyTitle>
              <EmptyDescription>
                Paste a seeded Convex userId in the strip below to load tasks.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : tasks === undefined ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : (
          <TaskTable
            tasks={visibleTasks}
            onEdit={setEditing}
            onCancel={setCancelling}
          />
        )}
      </div>

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

      {ready ? (
        <DemoUserSetup
          userId={userId}
          onSave={setUserId}
          onClear={() => setUserId(null)}
          inputId="tasks-convex-user-id"
        />
      ) : null}
    </section>
  )
}
