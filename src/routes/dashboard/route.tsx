import { Outlet, createFileRoute } from "@tanstack/react-router"

import { AppSidebar } from "@/components/app-sidebar"
import { RequireAuth } from "@/components/auth-gate"
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <RequireAuth requireOnboarded>
      <SidebarProvider>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border/70 bg-background/75 px-4 backdrop-blur-md md:px-6">
            <SidebarTrigger className="-ml-1 min-h-11 min-w-11 md:min-h-8 md:min-w-8" />
            <Separator orientation="vertical" className="h-4" />
            <DashboardBreadcrumb />
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </header>
          <div
            id="main-content"
            tabIndex={-1}
            className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-4 outline-none md:gap-10 md:p-8"
          >
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </RequireAuth>
  )
}
