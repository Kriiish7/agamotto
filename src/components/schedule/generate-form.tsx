import * as React from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ArrowsClockwiseIcon, CalendarBlankIcon } from "@phosphor-icons/react"
import {
  defaultRange,
  endOfLocalDay,
  fromDateInputValue,
  toDateInputValue,
} from "./format"

type GenerateFormProps = {
  disabled?: boolean
  busy?: boolean
  canReschedule?: boolean
  onGenerate: (range: { rangeStart: number; rangeEnd: number }) => Promise<void>
  onReschedule?: () => Promise<void>
}

export function GenerateScheduleForm({
  disabled,
  busy,
  canReschedule,
  onGenerate,
  onReschedule,
}: GenerateFormProps) {
  const initial = defaultRange()
  const [startDate, setStartDate] = React.useState(toDateInputValue(initial.start))
  const [endDate, setEndDate] = React.useState(toDateInputValue(initial.end))
  const [error, setError] = React.useState<string | null>(null)

  async function handleGenerate(event: React.FormEvent) {
    event.preventDefault()
    const rangeStart = fromDateInputValue(startDate)
    const rangeEnd = endOfLocalDay(fromDateInputValue(endDate))
    if (!Number.isFinite(rangeStart) || !Number.isFinite(rangeEnd)) {
      setError("Pick a valid start and end date.")
      return
    }
    if (rangeEnd < rangeStart) {
      setError("End date must be on or after the start date.")
      return
    }
    setError(null)
    await onGenerate({ rangeStart, rangeEnd })
  }

  return (
    <form
      onSubmit={(e) => void handleGenerate(e)}
      className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-4 shadow-[0_16px_50px_-40px_oklch(0.4_0.08_264_/_0.5)] backdrop-blur-sm sm:p-5"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 0% 0%, oklch(0.94 0.03_264 / 0.7), transparent 55%), radial-gradient(ellipse at 100% 100%, oklch(0.95 0.02 230 / 0.45), transparent 50%)",
        }}
      />
      <div className="relative flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary shadow-sm">
            <CalendarBlankIcon weight="duotone" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-sm font-medium tracking-tight">
              Generate schedule
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Pick a horizon. Agamotto packs ready tasks into your working
              windows and explains every placement.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="schedule-range-start">From</FieldLabel>
            <Input
              id="schedule-range-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={disabled || busy}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="schedule-range-end">Through</FieldLabel>
            <Input
              id="schedule-range-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={disabled || busy}
              required
            />
            <FieldDescription>
              Inclusive end of day in your local timezone.
            </FieldDescription>
          </Field>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="submit" disabled={disabled || busy}>
            {busy ? "Working…" : "Generate schedule"}
          </Button>
          {onReschedule ? (
            <Button
              type="button"
              variant="outline"
              disabled={disabled || busy || !canReschedule}
              onClick={() => void onReschedule()}
            >
              <ArrowsClockwiseIcon data-icon="inline-start" />
              Reschedule incomplete
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  )
}
