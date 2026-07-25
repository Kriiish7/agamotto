import { Link, useNavigate, useRouterState } from "@tanstack/react-router"
import {
  CalendarBlank,
  ChartBar,
  Gear,
  House,
  ListChecks,
  SignOut,
} from "@phosphor-icons/react"

import { useAuth } from "@/lib/auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navItems = [
  { title: "Home", to: "/dashboard", icon: House },
  { title: "Schedule", to: "/dashboard/schedule", icon: CalendarBlank },
  { title: "Tasks", to: "/dashboard/tasks", icon: ListChecks },
  { title: "Analytics", to: "/dashboard/analytics", icon: ChartBar },
  { title: "Settings", to: "/dashboard/settings", icon: Gear },
] as const

export function AppSidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
            A
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium">Agamotto</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.name ?? "Guest"}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigate</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  item.to === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === item.to || pathname.startsWith(`${item.to}/`)

                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      render={<Link to={item.to} />}
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Icon weight="duotone" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={() => {
                signOut()
                void navigate({ to: "/login" })
              }}
            >
              <SignOut weight="duotone" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
