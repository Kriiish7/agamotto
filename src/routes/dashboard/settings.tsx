import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { SignOut } from "@phosphor-icons/react"

import { PageHeader } from "@/components/page-header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth"

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const initials =
    user?.name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "A"

  return (
    <section className="flex flex-col gap-8">
      <PageHeader
        title="Settings"
        description="Account details from the stub session. Swap for Convex Auth when ready."
      />

      <Card className="max-w-lg border-border/70">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar size="lg">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <CardTitle className="font-heading">{user?.name ?? "Guest"}</CardTitle>
            <CardDescription className="truncate">
              {user?.email ?? "No email on stub session"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Separator />
          <dl className="grid gap-3 text-sm">
            <div className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:items-center">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="min-w-0 font-medium break-words">
                {user?.name ?? "—"}
              </dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:items-center">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="min-w-0 font-medium break-all">
                {user?.email ?? "—"}
              </dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:items-center">
              <dt className="text-muted-foreground">Session</dt>
              <dd className="font-medium">Stub · localStorage</dd>
            </div>
          </dl>
          <Button
            variant="outline"
            className="w-fit"
            onClick={() => {
              signOut()
              void navigate({ to: "/login" })
            }}
          >
            <SignOut data-icon="inline-start" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}
