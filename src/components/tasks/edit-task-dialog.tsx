import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Doc } from "../../../convex/_generated/dataModel"
import {
  STATUS_LABEL,
  TASK_STATUSES,
  type TaskStatus,
} from "./task-labels"

type EditTaskDialogProps = {
  task: Doc<"tasks"> | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (patch: {
    title: string
    durationMinutes: number
    priority: number
    category: string
    status: TaskStatus
    deadline: number | null
  }) => Promise<void>
}

function toDateInputValue(ms: number | undefined): string {
  if (ms == null) return ""
  const d = new Date(ms)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function fromDateInputValue(value: string): number | null {
  if (!value) return null
  const d = new Date(`${value}T23:59:59.999`)
  if (Number.isNaN(d.getTime())) return null
  return d.getTime()
}

export function EditTaskDialog({
  task,
  open,
  onOpenChange,
  onSave,
}: EditTaskDialogProps) {
  const [title, setTitle] = React.useState("")
  const [durationMinutes, setDurationMinutes] = React.useState("30")
  const [priority, setPriority] = React.useState("3")
  const [category, setCategory] = React.useState("general")
  const [status, setStatus] = React.useState<TaskStatus>("inbox")
  const [deadline, setDeadline] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  React.useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setDurationMinutes(String(task.durationMinutes))
    setPriority(String(task.priority))
    setCategory(task.category)
    setStatus(task.status)
    setDeadline(toDateInputValue(task.deadline))
    setError(null)
  }, [task])

  async function handleSave() {
    const trimmed = title.trim()
    if (!trimmed) {
      setError("Title is required")
      return
    }
    const duration = Number(durationMinutes)
    const prio = Number(priority)
    if (!Number.isFinite(duration) || duration <= 0) {
      setError("Duration must be a positive number of minutes")
      return
    }
    if (!Number.isInteger(prio) || prio < 1 || prio > 5) {
      setError("Priority must be an integer from 1 to 5")
      return
    }

    setPending(true)
    setError(null)
    try {
      await onSave({
        title: trimmed,
        durationMinutes: duration,
        priority: prio,
        category: category.trim() || "general",
        status,
        deadline: fromDateInputValue(deadline),
      })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>
            Update fields and save. Soft-cancel is available from the list.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="edit-title">Title</FieldLabel>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={pending}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="edit-duration">Duration (minutes)</FieldLabel>
              <Input
                id="edit-duration"
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                disabled={pending}
              />
            </Field>
            <Field>
              <FieldLabel>Priority</FieldLabel>
              <Select
                value={priority}
                onValueChange={(v) => {
                  if (v != null) setPriority(String(v))
                }}
                disabled={pending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value) => (value != null ? `P${String(value)}` : "Priority")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      P{n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="edit-category">Category</FieldLabel>
              <Input
                id="edit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={pending}
              />
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select
                value={status}
                onValueChange={(v) => {
                  if (v != null) setStatus(v as TaskStatus)
                }}
                disabled={pending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value) =>
                      typeof value === "string" && value in STATUS_LABEL
                        ? STATUS_LABEL[value as TaskStatus]
                        : "Status"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="edit-deadline">Deadline</FieldLabel>
            <Input
              id="edit-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={pending}
            />
          </Field>
        </FieldGroup>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
