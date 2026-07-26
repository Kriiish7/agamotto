import * as React from "react"
import { Link, useNavigate, useRouterState } from "@tanstack/react-router"
import {
  CalendarBlank,
  ChartBar,
  Gear,
  House,
  ListChecks,
  SignOut,
} from "@phosphor-icons/react"

import { BrandMark } from "@/components/brand-mark"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth"

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
  const { setOpenMobile } = useSidebar()

  React.useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  const initials =
    user?.name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "A"

  return (
    <Sidebar collapsible="icon" className="border-border/70">
      <SidebarHeader className="border-b border-sidebar-border/80">
        <div className="flex items-center gap-2 px-2 py-2">
          <BrandMark size="sm" />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate font-heading text-sm font-semibold tracking-tight">
              Agamotto
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Schedule with reasons
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  item.to === "/dashboard"
                    ? pathname === "/dashboard" || pathname === "/dashboard/"
                    : pathname === item.to || pathname.startsWith(`${item.to}/`)

                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      render={<Link to={item.to} />}
                      isActive={isActive}
                      tooltip={item.title}
                      onClick={() => setOpenMobile(false)}
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

      <SidebarFooter className="border-t border-sidebar-border/80">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="mb-1 flex items-center gap-2.5 rounded-xl px-2 py-2 group-data-[collapsible=icon]:justify-center">
              <Avatar size="sm">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-medium">
                  {user?.name ?? "Guest"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email ?? "stub session"}
                </p>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={() => {
                setOpenMobile(false)
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
