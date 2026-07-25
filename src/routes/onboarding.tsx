import * as React from "react"
import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router"

import { AuthLoading } from "@/components/auth-gate"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth"

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
})

function OnboardingPage() {
  const { user, isLoading, completeOnboarding } = useAuth()
  const navigate = useNavigate()
  const [focus, setFocus] = React.useState("")

  if (isLoading) return <AuthLoading />
  if (!user) return <Navigate to="/login" />
  if (user.onboarded) return <Navigate to="/dashboard" />

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    // TODO: Persist onboarding prefs via Convex once schema/auth are ready.
    completeOnboarding()
    void navigate({ to: "/dashboard" })
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-[radial-gradient(ellipse_at_top,_oklch(0.97_0.02_264),_oklch(0.98_0_0)_55%)] p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Agamotto
          </p>
          <CardTitle className="text-2xl">Set up your day</CardTitle>
          <CardDescription>
            Hi {user.name}. Tell us what matters most — we&apos;ll use this later
            for scheduling.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="focus">Primary focus</FieldLabel>
                <Input
                  id="focus"
                  name="focus"
                  placeholder="Deep work, meetings, learning…"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                />
                <FieldDescription>
                  Placeholder preference — not persisted yet.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3">
            <Button type="submit" className="w-full">
              Enter dashboard
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Wrong account?{" "}
              <Link to="/login" className="underline underline-offset-4">
                Back to login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
