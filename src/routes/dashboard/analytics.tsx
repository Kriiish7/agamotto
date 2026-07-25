import * as React from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"

import {
  DemoUserSetup,
  SchedulesList,
  StatusBreakdown,
  useDemoUserId,
} from "@/components/analytics"
import {
  BLOCK_STATUSES,
  BLOCK_STATUS_LABEL,
  BLOCK_STATUS_TONE,
  TASK_STATUSES,
  TASK_STATUS_LABEL,
  TASK_STATUS_TONE,
  countByStatus,
  formatDateRange,
} from "@/components/analytics/labels"
import { Separator } from "@/components/ui/separator"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const { userId, setUserId, ready } = useDemoUserId()
  const [selectedScheduleId, setSelectedScheduleId] =
    React.useState<Id<"schedules"> | null>(null)

  const tasks = useQuery(
    api.tasks.list,
    userId == null ? "skip" : { userId },
  )
  const schedules = useQuery(
    api.schedules.listSchedules,
    userId == null ? "skip" : { userId },
  )

  // Default selection: newest active schedule, else newest overall.
  React.useEffect(() => {
    if (!schedules || schedules.length === 0) {
      setSelectedScheduleId(null)
      return
    }
    setSelectedScheduleId((current) => {
      if (current && schedules.some((s) => s._id === current)) return current
      const active = schedules.find((s) => s.status === "active")
      return active?._id ?? schedules[0]!._id
    })
  }, [schedules])

  const scheduleDetail = useQuery(
    api.schedules.getSchedule,
    userId == null || selectedScheduleId == null
      ? "skip"
      : { userId, scheduleId: selectedScheduleId },
  )

  const taskCounts = React.useMemo(
    () => countByStatus(tasks ?? [], TASK_STATUSES),
    [tasks],
  )
  const blockCounts = React.useMemo(
    () => countByStatus(scheduleDetail?.blocks ?? [], BLOCK_STATUSES),
    [scheduleDetail],
  )

  const selectedMeta = scheduleDetail?.schedule

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-medium tracking-tight">Analytics</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Completion-state breakdown for tasks and schedule blocks, plus a list
          of generated schedules. Timeline editing lives under{" "}
          <Link
            to="/dashboard/schedule"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Schedule
          </Link>
          .
        </p>
      </div>

      {!userId ? (
        <p className="text-sm text-muted-foreground">
          Paste a seeded Convex userId in the demo strip below to load analytics.
        </p>
      ) : (
        <>
          <div className="grid gap-8 lg:grid-cols-2">
            <StatusBreakdown
              title="Task completion"
              description="Counts by task status across the board."
              order={TASK_STATUSES}
              counts={taskCounts}
              labels={TASK_STATUS_LABEL}
              tones={TASK_STATUS_TONE}
              emptyMessage={
                tasks === undefined ? "Loading tasks…" : "No tasks yet."
              }
            />
            <StatusBreakdown
              title="Block completion"
              description={
                selectedMeta
                  ? `Blocks on ${formatDateRange(selectedMeta.rangeStart, selectedMeta.rangeEnd)} (${selectedMeta.mode}).`
                  : "Select a schedule below to see block proportions."
              }
              order={BLOCK_STATUSES}
              counts={blockCounts}
              labels={BLOCK_STATUS_LABEL}
              tones={BLOCK_STATUS_TONE}
              emptyMessage={
                selectedScheduleId == null
                  ? "No schedule selected."
                  : scheduleDetail === undefined
                    ? "Loading blocks…"
                    : "This schedule has no blocks."
              }
            />
          </div>

          <Separator />

          <SchedulesList
            schedules={schedules}
            selectedId={selectedScheduleId}
            onSelect={setSelectedScheduleId}
          />
        </>
      )}

      {ready ? (
        <DemoUserSetup
          userId={userId}
          onSave={setUserId}
          onClear={() => setUserId(null)}
          inputId="analytics-convex-user-id"
        />
      ) : null}
    </section>
  )
}
