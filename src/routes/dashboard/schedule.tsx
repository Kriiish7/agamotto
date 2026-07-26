import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"

import { PageHeader } from "@/components/page-header"
import {
  DemoUserSetup,
  GenerateScheduleForm,
  OverrideBlockDialog,
  ScheduleTimeline,
  useDemoUserId,
} from "@/components/schedule"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { api } from "../../../convex/_generated/api"
import type { Doc, Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/dashboard/schedule")({
  component: SchedulePage,
})

function SchedulePage() {
  const { user } = useAuth()
  const { userId, setUserId, ready } = useDemoUserId()
  const [activeScheduleId, setActiveScheduleId] =
    React.useState<Id<"schedules"> | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [actionError, setActionError] = React.useState<string | null>(null)
  const [editing, setEditing] = React.useState<Doc<"scheduleBlocks"> | null>(
    null,
  )

  const schedules = useQuery(
    api.schedules.listSchedules,
    userId ? { userId } : "skip",
  )
  const scheduleDetail = useQuery(
    api.schedules.getSchedule,
    userId && activeScheduleId
      ? { userId, scheduleId: activeScheduleId }
      : "skip",
  )
  const tasks = useQuery(api.tasks.list, userId ? { userId } : "skip")

  const generateSchedule = useMutation(api.schedules.generateSchedule)
  const rescheduleIncomplete = useMutation(api.schedules.rescheduleIncomplete)
  const overrideBlock = useMutation(api.schedules.overrideBlock)

  // Prefer the newest active schedule when none selected yet.
  React.useEffect(() => {
    if (!schedules || schedules.length === 0) return
    if (activeScheduleId) {
      const stillThere = schedules.some((s) => s._id === activeScheduleId)
      if (stillThere) return
    }
    const active = schedules.find((s) => s.status === "active") ?? schedules[0]
    setActiveScheduleId(active._id)
  }, [schedules, activeScheduleId])

  const taskTitles = React.useMemo(() => {
    const map = new Map<Id<"tasks">, string>()
    if (!tasks) return map
    for (const t of tasks) {
      map.set(t._id, t.title)
    }
    return map
  }, [tasks])

  // Deferred comes from the schedule record (cold load / refresh / switch).
  const delayed = scheduleDetail?.delayed ?? []
  const excluded = scheduleDetail?.excluded ?? []
  const packedSummary =
    scheduleDetail?.schedule && scheduleDetail.blocks
      ? {
          mode: scheduleDetail.schedule.mode,
          blockCount: scheduleDetail.blocks.length,
          delayedCount: delayed.length,
          excludedCount: excluded.length,
        }
      : null

  async function handleGenerate(range: {
    rangeStart: number
    rangeEnd: number
  }) {
    if (!userId) return
    setBusy(true)
    setActionError(null)
    try {
      const result = await generateSchedule({
        userId,
        rangeStart: range.rangeStart,
        rangeEnd: range.rangeEnd,
      })
      setActiveScheduleId(result.scheduleId)
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to generate schedule",
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleReschedule() {
    if (!userId || !activeScheduleId) return
    setBusy(true)
    setActionError(null)
    try {
      await rescheduleIncomplete({
        userId,
        scheduleId: activeScheduleId,
      })
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to reschedule",
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleOverride(args: {
    blockId: Id<"scheduleBlocks">
    start: number
    end: number
    status: "planned" | "completed" | "skipped" | "moved"
  }) {
    if (!userId) throw new Error("Set a Convex userId first")
    await overrideBlock({
      userId,
      blockId: args.blockId,
      start: args.start,
      end: args.end,
      status: args.status,
    })
  }

  const detailLoading =
    Boolean(userId && activeScheduleId) && scheduleDetail === undefined

  return (
    <section className="relative flex flex-col gap-8">
      <PageHeader
        title="Schedule"
        description={
          <>
            Generate a plan, then read the timeline as a trail of decisions —
            every block says why it is there
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

      <GenerateScheduleForm
        disabled={!userId}
        busy={busy}
        canReschedule={Boolean(activeScheduleId)}
        onGenerate={handleGenerate}
        onReschedule={handleReschedule}
      />

      {actionError ? (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      {packedSummary ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            Packed{" "}
            <span className="font-medium text-foreground">
              {packedSummary.blockCount}
            </span>{" "}
            blocks in
          </span>
          <Badge variant="secondary" className="capitalize">
            {packedSummary.mode}
          </Badge>
          {packedSummary.delayedCount + packedSummary.excludedCount > 0 ? (
            <span>
              · {packedSummary.delayedCount} delayed ·{" "}
              {packedSummary.excludedCount} excluded
            </span>
          ) : null}
        </div>
      ) : null}

      {schedules && schedules.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {schedules.slice(0, 6).map((s) => {
            const selected = s._id === activeScheduleId
            return (
              <Button
                key={s._id}
                type="button"
                size="sm"
                variant={selected ? "default" : "outline"}
                aria-pressed={selected}
                onClick={() => setActiveScheduleId(s._id)}
              >
                <span className="capitalize">{s.status}</span>
                <span className="text-muted-foreground">·</span>
                <span className="capitalize">{s.mode}</span>
              </Button>
            )
          })}
        </div>
      ) : null}

      <ScheduleTimeline
        schedule={scheduleDetail?.schedule}
        blocks={scheduleDetail?.blocks}
        taskTitles={taskTitles}
        delayed={delayed}
        excluded={excluded}
        loading={detailLoading}
        onEditBlock={setEditing}
      />

      <OverrideBlockDialog
        block={editing}
        open={editing != null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        onSave={handleOverride}
      />

      {ready ? (
        <DemoUserSetup
          userId={userId}
          onSave={setUserId}
          onClear={() => setUserId(null)}
          inputId="schedule-convex-user-id"
        />
      ) : null}
    </section>
  )
}
