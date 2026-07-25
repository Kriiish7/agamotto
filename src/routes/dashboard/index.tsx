import { createFileRoute } from "@tanstack/react-router"

import { useAuth } from "@/lib/auth"

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHomePage,
})

function DashboardHomePage() {
  const { user } = useAuth()

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-medium tracking-tight">
        Good to see you{user?.name ? `, ${user.name}` : ""}
      </h1>
      <p className="max-w-xl text-sm text-muted-foreground">
        Home dashboard stub. Timeline, tasks, and analytics will land in later
        tracks — this shell is ready for them.
      </p>
    </section>
  )
}
