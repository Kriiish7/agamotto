import { createFileRoute, useNavigate } from "@tanstack/react-router"

import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-medium tracking-tight">Settings</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Settings placeholder. Account details below come from the stub
          session.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Stub session stored in localStorage. Replace with Convex Auth later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Name</span>
            <span>{user?.name ?? "—"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Email</span>
            <span>{user?.email ?? "—"}</span>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              signOut()
              void navigate({ to: "/login" })
            }}
          >
            Sign out
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}
