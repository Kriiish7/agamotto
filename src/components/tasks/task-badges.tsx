import { Badge } from "@/components/ui/badge"
import {
  STATUS_LABEL,
  priorityLabel,
  type TaskStatus,
} from "./task-labels"

function statusVariant(
  status: TaskStatus,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "done":
      return "secondary"
    case "cancelled":
      return "destructive"
    case "in_progress":
    case "scheduled":
      return "default"
    default:
      return "outline"
  }
}

function priorityVariant(
  priority: number,
): "default" | "secondary" | "outline" | "destructive" {
  if (priority >= 5) return "destructive"
  if (priority >= 4) return "default"
  if (priority <= 2) return "outline"
  return "secondary"
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={statusVariant(status)}>{STATUS_LABEL[status]}</Badge>
}

export function PriorityBadge({ priority }: { priority: number }) {
  return (
    <Badge variant={priorityVariant(priority)}>{priorityLabel(priority)}</Badge>
  )
}

export function CategoryBadge({ category }: { category: string }) {
  return <Badge variant="outline">{category}</Badge>
}
