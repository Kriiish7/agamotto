import { Outlet, createFileRoute } from "@tanstack/react-router"

import { AppSidebar } from "@/components/app-sidebar"
import { RequireAuth } from "@/components/auth-gate"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

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
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1 min-h-11 min-w-11 md:min-h-8 md:min-w-8" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <p className="text-sm text-muted-foreground">Dashboard</p>
          </header>
          <div
            id="main-content"
            tabIndex={-1}
            className="flex flex-1 flex-col gap-4 p-6 outline-none"
          >
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </RequireAuth>
  )
}
