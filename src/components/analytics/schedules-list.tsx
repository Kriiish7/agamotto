import { Link } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { Doc, Id } from "../../../convex/_generated/dataModel"
import {
  SCHEDULE_MODE_LABEL,
  SCHEDULE_STATUS_LABEL,
  formatDateRange,
  formatTimestamp,
  type ScheduleMode,
  type ScheduleStatus,
} from "./labels"

type SchedulesListProps = {
  schedules: Doc<"schedules">[] | undefined
  selectedId: Id<"schedules"> | null
  onSelect: (scheduleId: Id<"schedules">) => void
}

function modeVariant(
  mode: ScheduleMode,
): "default" | "secondary" | "outline" {
  return mode === "crunch" ? "default" : "secondary"
}

function statusVariant(
  status: ScheduleStatus,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "active") return "default"
  if (status === "superseded") return "outline"
  if (status === "archived") return "secondary"
  return "outline"
}

export function SchedulesList({
  schedules,
  selectedId,
  onSelect,
}: SchedulesListProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-medium">Schedules</h2>
        <p className="text-sm text-muted-foreground">
          Generated plans for this user. Open the{" "}
          <Link
            to="/dashboard/schedule"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Schedule
          </Link>{" "}
          nav item for the interactive timeline and generate controls.
        </p>
      </div>

      {schedules === undefined ? (
        <p className="text-sm text-muted-foreground">Loading schedules…</p>
      ) : schedules.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No schedules yet. Generate one from Schedule.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date range</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Generated</TableHead>
              <TableHead className="text-right">Blocks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((schedule) => {
              const selected = schedule._id === selectedId
              return (
                <TableRow
                  key={schedule._id}
                  data-state={selected ? "selected" : undefined}
                  className={cn(selected && "bg-muted/50")}
                >
                  <TableCell className="font-medium">
                    {formatDateRange(schedule.rangeStart, schedule.rangeEnd)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={modeVariant(schedule.mode)}>
                      {SCHEDULE_MODE_LABEL[schedule.mode]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(schedule.status)}>
                      {SCHEDULE_STATUS_LABEL[schedule.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatTimestamp(schedule.generatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      onClick={() => onSelect(schedule._id)}
                    >
                      {selected ? "Selected" : "View blocks"}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
