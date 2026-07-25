import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { parseTaskInput } from "./parse-task-input"
import {
  CategoryBadge,
  PriorityBadge,
} from "./task-badges"
import { formatDeadline, formatDuration } from "./task-labels"

type QuickAddBarProps = {
  disabled?: boolean
  onSubmit: (parsed: ReturnType<typeof parseTaskInput>) => Promise<void> | void
}

export function QuickAddBar({ disabled, onSubmit }: QuickAddBarProps) {
  const [value, setValue] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  const preview = React.useMemo(
    () => (value.trim() ? parseTaskInput(value) : null),
    [value],
  )

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const parsed = parseTaskInput(value)
    if (!parsed.title) {
      setError("Add a title (duration/priority tags are optional).")
      return
    }
    setError(null)
    setPending(true)
    try {
      await onSubmit(parsed)
      setValue("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='e.g. "Ship landing for 2h p4 due friday #engineering"'
          disabled={disabled || pending}
          aria-label="Quick add task"
          className="flex-1"
        />
        <Button type="submit" disabled={disabled || pending || !value.trim()}>
          {pending ? "Adding…" : "Add task"}
        </Button>
      </div>
      {preview?.title ? (
        <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{preview.title}</span>
          <span>{formatDuration(preview.durationMinutes)}</span>
          <PriorityBadge priority={preview.priority} />
          <CategoryBadge category={preview.category} />
          {preview.deadline != null ? (
            <span>due {formatDeadline(preview.deadline)}</span>
          ) : null}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Tips: <code className="text-[0.7rem]">2h</code>,{" "}
          <code className="text-[0.7rem]">p4</code>,{" "}
          <code className="text-[0.7rem]">due friday</code>,{" "}
          <code className="text-[0.7rem]">#category</code>
        </p>
      )}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
