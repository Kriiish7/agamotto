import { createFileRoute, Link } from "@tanstack/react-router"
import {
  ArrowRight,
  CalendarBlank,
  ChartBar,
  ListChecks,
} from "@phosphor-icons/react"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/lib/auth"

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHomePage,
})

const destinations = [
  {
    title: "Schedule",
    description: "Generate a plan and read every placement explanation inline.",
    to: "/dashboard/schedule",
    icon: CalendarBlank,
  },
  {
    title: "Tasks",
    description: "Quick-add work with light NL parsing, then refine the queue.",
    to: "/dashboard/tasks",
    icon: ListChecks,
  },
  {
    title: "Analytics",
    description: "Completion breakdowns for tasks and packed schedule blocks.",
    to: "/dashboard/analytics",
    icon: ChartBar,
  },
] as const

function DashboardHomePage() {
  const { user } = useAuth()
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  return (
    <section className="flex flex-col gap-8">
      <PageHeader
        title={`${greeting}${user?.name ? `, ${user.name}` : ""}`}
        description="Pick up where you left off — pack a day, triage tasks, or check how the last plan landed."
        actions={
          <Button render={<Link to="/dashboard/schedule" />}>
            Open schedule
            <ArrowRight data-icon="inline-end" />
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {destinations.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.to} to={item.to} className="group outline-none">
              <Card className="h-full border-border/70 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-36px_oklch(0.4_0.1_264_/_0.55)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                <CardHeader className="gap-4">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon weight="duotone" className="size-5" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <CardTitle className="flex items-center gap-2 font-heading text-lg">
                      {item.title}
                      <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100 motion-reduce:transition-none" />
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
