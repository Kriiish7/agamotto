import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/schedule")({
  component: SchedulePage,
})

function SchedulePage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-medium tracking-tight">Schedule</h1>
      <p className="max-w-xl text-sm text-muted-foreground">
        Timeline / schedule placeholder. Real scheduling UI belongs to another
        track.
      </p>
    </section>
  )
}
