import { Link, useRouterState } from "@tanstack/react-router"
import { Fragment } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const LABELS: Record<string, string> = {
  dashboard: "Home",
  schedule: "Schedule",
  tasks: "Tasks",
  analytics: "Analytics",
  settings: "Settings",
}

export function DashboardBreadcrumb() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const parts = pathname.split("/").filter(Boolean)

  if (parts.length === 0) return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {parts.map((part, index) => {
          const href = `/${parts.slice(0, index + 1).join("/")}`
          const label = LABELS[part] ?? part
          const isLast = index === parts.length - 1

          return (
            <Fragment key={href}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link to={href} />}>
                    {label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
