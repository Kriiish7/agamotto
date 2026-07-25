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
import type { Doc } from "../../../convex/_generated/dataModel"

type CancelTaskDialogProps = {
  task: Doc<"tasks"> | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

export function CancelTaskDialog({
  task,
  open,
  onOpenChange,
  onConfirm,
}: CancelTaskDialogProps) {
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleConfirm() {
    setPending(true)
    setError(null)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel task")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel task?</DialogTitle>
          <DialogDescription>
            Soft-cancels{" "}
            <span className="font-medium text-foreground">
              {task?.title ?? "this task"}
            </span>
            . History stays intact; this is not a hard delete.
          </DialogDescription>
        </DialogHeader>
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
            Keep
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={pending}
          >
            {pending ? "Cancelling…" : "Cancel task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
