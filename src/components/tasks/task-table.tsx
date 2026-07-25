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

export function TaskTable({ tasks, onEdit, onCancel }: TaskTableProps) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        No tasks yet. Use the quick-add bar above to create one.
      </p>
    )
  }

  return (
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
            className={task.status === "cancelled" ? "opacity-60" : undefined}
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
              <div className="flex justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${task.title}`}
                  onClick={() => onEdit(task)}
                >
                  <PencilSimple />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Cancel ${task.title}`}
                  disabled={task.status === "cancelled"}
                  onClick={() => onCancel(task)}
                >
                  <Trash />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
