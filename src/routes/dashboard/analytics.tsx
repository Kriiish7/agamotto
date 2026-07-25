import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-medium tracking-tight">Analytics</h1>
      <p className="max-w-xl text-sm text-muted-foreground">
        Analytics placeholder. Charts and insights are not implemented yet.
      </p>
    </section>
  )
}
