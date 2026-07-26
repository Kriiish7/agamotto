import * as React from "react"
import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router"
import { ArrowRight } from "@phosphor-icons/react"

import { AuthLoading } from "@/components/auth-gate"
import { ThemeToggle } from "@/components/theme-toggle"
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
    <main className="relative flex min-h-[100dvh] items-center justify-center bg-background p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="gap-2">
          <CardTitle className="font-heading text-2xl font-semibold">
            Set up your day
          </CardTitle>
          <CardDescription>
            Hi {user.name}. Tell us what matters most — we&apos;ll use this
            later when packing your schedule.
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
              <ArrowRight data-icon="inline-end" />
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Wrong account?{" "}
              <Link
                to="/login"
                className="rounded-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
              >
                Back to login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
