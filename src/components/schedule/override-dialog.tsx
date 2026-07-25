import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Doc, Id } from "../../../convex/_generated/dataModel"
import {
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from "./format"

const BLOCK_STATUSES = [
  "planned",
  "completed",
  "skipped",
  "moved",
] as const

type BlockStatus = (typeof BLOCK_STATUSES)[number]

type OverrideDialogProps = {
  block: Doc<"scheduleBlocks"> | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (args: {
    blockId: Id<"scheduleBlocks">
    start: number
    end: number
    status: BlockStatus
  }) => Promise<void>
}

export function OverrideBlockDialog({
  block,
  open,
  onOpenChange,
  onSave,
}: OverrideDialogProps) {
  const [startLocal, setStartLocal] = React.useState("")
  const [endLocal, setEndLocal] = React.useState("")
  const [status, setStatus] = React.useState<BlockStatus>("planned")
  const [error, setError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!block) return
    setStartLocal(toDateTimeLocalValue(block.start))
    setEndLocal(toDateTimeLocalValue(block.end))
    setStatus(block.status)
    setError(null)
  }, [block])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!block) return
    const start = fromDateTimeLocalValue(startLocal)
    const end = fromDateTimeLocalValue(endLocal)
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      setError("Enter valid start and end times.")
      return
    }
    if (end <= start) {
      setError("End must be after start.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave({ blockId: block._id, start, end, status })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Override failed")
    } finally {
      setSaving(false)
    }
  }

  function nudge(minutes: number) {
    const start = fromDateTimeLocalValue(startLocal)
    const end = fromDateTimeLocalValue(endLocal)
    if (!Number.isFinite(start) || !Number.isFinite(end)) return
    const delta = minutes * 60_000
    setStartLocal(toDateTimeLocalValue(start + delta))
    setEndLocal(toDateTimeLocalValue(end + delta))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={(e) => void handleSubmit(e)}>
          <DialogHeader>
            <DialogTitle>Move block</DialogTitle>
            <DialogDescription>
              Manual overrides stay fixed when you reschedule incomplete work.
              The explanation will note that you moved it.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            <Field>
              <FieldLabel htmlFor="override-start">Start</FieldLabel>
              <Input
                id="override-start"
                type="datetime-local"
                value={startLocal}
                onChange={(e) => setStartLocal(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="override-end">End</FieldLabel>
              <Input
                id="override-end"
                type="datetime-local"
                value={endLocal}
                onChange={(e) => setEndLocal(e.target.value)}
                required
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => nudge(-30)}
              >
                −30m
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => nudge(30)}
              >
                +30m
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => nudge(60)}
              >
                +1h
              </Button>
            </div>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select
                value={status}
                onValueChange={(v) => {
                  if (
                    v === "planned" ||
                    v === "completed" ||
                    v === "skipped" ||
                    v === "moved"
                  ) {
                    setStatus(v)
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOCK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            {block?.isManualOverride ? (
              <Badge variant="outline" className="border-dashed border-zinc-400">
                Already pinned as override
              </Badge>
            ) : null}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save override"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
