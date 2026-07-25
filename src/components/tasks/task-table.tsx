import { PencilSimple, Trash } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Doc } from "../../../convex/_generated/dataModel"
import {
  CategoryBadge,
  PriorityBadge,
  StatusBadge,
} from "./task-badges"
import { formatDeadline, formatDuration } from "./task-labels"

type TaskTableProps = {
  tasks: Doc<"tasks">[]
  onEdit: (task: Doc<"tasks">) => void
  onCancel: (task: Doc<"tasks">) => void
}

function TaskActions({
  task,
  onEdit,
  onCancel,
}: {
  task: Doc<"tasks">
  onEdit: (task: Doc<"tasks">) => void
  onCancel: (task: Doc<"tasks">) => void
}) {
  return (
    <div className="flex gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="min-h-11 min-w-11 md:min-h-8 md:min-w-8"
        aria-label={`Edit ${task.title}`}
        onClick={() => onEdit(task)}
      >
        <PencilSimple />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="min-h-11 min-w-11 md:min-h-8 md:min-w-8"
        aria-label={`Cancel ${task.title}`}
        disabled={task.status === "cancelled"}
        onClick={() => onCancel(task)}
      >
        <Trash />
      </Button>
    </div>
  )
}

export function TaskTable({ tasks, onEdit, onCancel }: TaskTableProps) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        No tasks yet. Use the quick-add bar above to create one.
      </p>
    )
  }

  return (
    <>
      {/* Mobile / small: stacked cards */}
      <ul className="space-y-3 md:hidden">
        {tasks.map((task) => (
          <li
            key={task._id}
            className={
              task.status === "cancelled"
                ? "rounded-2xl border border-border/80 p-4 opacity-60"
                : "rounded-2xl border border-border/80 p-4"
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <p className="font-medium leading-snug">{task.title}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  <CategoryBadge category={task.category} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDuration(task.durationMinutes)}
                  <span className="mx-1.5 text-border">·</span>
                  {formatDeadline(task.deadline)}
                </p>
              </div>
              <TaskActions task={task} onEdit={onEdit} onCancel={onCancel} />
            </div>
          </li>
        ))}
      </ul>

      {/* md+: table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow
                key={task._id}
                className={
                  task.status === "cancelled" ? "opacity-60" : undefined
                }
              >
                <TableCell className="max-w-[16rem] truncate font-medium whitespace-normal">
                  {task.title}
                </TableCell>
                <TableCell>
                  <StatusBadge status={task.status} />
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={task.priority} />
                </TableCell>
                <TableCell>
                  <CategoryBadge category={task.category} />
                </TableCell>
                <TableCell>{formatDuration(task.durationMinutes)}</TableCell>
                <TableCell>{formatDeadline(task.deadline)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <TaskActions
                      task={task}
                      onEdit={onEdit}
                      onCancel={onCancel}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
