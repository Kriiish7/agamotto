import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/tasks")({
  component: TasksPage,
})

function TasksPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-medium tracking-tight">Tasks</h1>
      <p className="max-w-xl text-sm text-muted-foreground">
        Tasks placeholder. NL parsing and task CRUD will be implemented later.
      </p>
    </section>
  )
}
