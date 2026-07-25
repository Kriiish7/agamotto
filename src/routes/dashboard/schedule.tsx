import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"

import {
  DemoUserSetup,
  GenerateScheduleForm,
  OverrideBlockDialog,
  ScheduleTimeline,
  useDemoUserId,
} from "@/components/schedule"
import type { GenerationMeta } from "@/components/schedule"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  const [generationMeta, setGenerationMeta] =
    React.useState<GenerationMeta | null>(null)
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
      setGenerationMeta({
        mode: result.mode,
        delayed: result.delayed,
        excluded: result.excluded,
        blockCount: result.blockCount,
      })
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
      const result = await rescheduleIncomplete({
        userId,
        scheduleId: activeScheduleId,
      })
      setGenerationMeta({
        mode: result.mode,
        delayed: result.delayed,
        excluded: result.excluded,
        blockCount: result.blockCount,
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
    <section className="relative space-y-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-6 -top-6 h-40 bg-[radial-gradient(ellipse_at_top_left,oklch(0.95_0.01_85),transparent_55%),radial-gradient(ellipse_at_top_right,oklch(0.96_0.008_250),transparent_50%)]"
      />

      <div className="relative space-y-2">
        <h1 className="text-2xl font-medium tracking-tight">Schedule</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Generate a plan, then read the timeline as a trail of decisions —
          every block says why it is there. Signed in as{" "}
          <span className="text-foreground">{user?.name ?? "guest"}</span>
          {user?.email ? (
            <>
              {" "}
              (<span className="font-mono text-xs">{user.email}</span>)
            </>
          ) : null}
          .
        </p>
      </div>

      {ready ? (
        <DemoUserSetup
          userId={userId}
          onSave={setUserId}
          onClear={() => setUserId(null)}
        />
      ) : null}

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

      {generationMeta ? (
        <p className="text-sm text-zinc-500">
          Last run packed{" "}
          <span className="font-medium text-zinc-800">
            {generationMeta.blockCount}
          </span>{" "}
          blocks in{" "}
          <span className="font-medium capitalize text-zinc-800">
            {generationMeta.mode}
          </span>{" "}
          mode
          {generationMeta.delayed.length + generationMeta.excluded.length > 0
            ? ` · ${generationMeta.delayed.length} delayed · ${generationMeta.excluded.length} excluded`
            : null}
          .
        </p>
      ) : null}

      {schedules && schedules.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {schedules.slice(0, 6).map((s) => (
            <button
              key={s._id}
              type="button"
              onClick={() => {
                setActiveScheduleId(s._id)
                setGenerationMeta(null)
              }}
              className={
                s._id === activeScheduleId
                  ? "rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white"
                  : "rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-zinc-300"
              }
            >
              <span className="capitalize">{s.status}</span>
              <span className="mx-1 text-zinc-400">·</span>
              <span className="capitalize">{s.mode}</span>
            </button>
          ))}
        </div>
      ) : null}

      <ScheduleTimeline
        schedule={scheduleDetail?.schedule}
        blocks={scheduleDetail?.blocks}
        taskTitles={taskTitles}
        delayed={generationMeta?.delayed ?? []}
        excluded={generationMeta?.excluded ?? []}
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
    </section>
  )
}
