import { createFileRoute, useNavigate } from "@tanstack/react-router"
import * as React from "react"
import { ArrowRight } from "@phosphor-icons/react"

import { RedirectIfAuthed } from "@/components/auth-gate"
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

export const Route = createFileRoute("/login")({ component: LoginPage })

function LoginPage() {
  return (
    <RedirectIfAuthed>
      <LoginForm />
    </RedirectIfAuthed>
  )
}

function LoginForm() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    // TODO: Swap stub signIn for Convex Auth credentials / OAuth.
    signIn({ name, email })
    void navigate({ to: "/onboarding" })
  }

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center bg-background p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="gap-2">
          <CardTitle className="font-heading text-2xl font-semibold">
            Welcome back
          </CardTitle>
          <CardDescription>
            Sign in to continue shaping your schedule.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="ada@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <FieldDescription>
                  Any values work — this is a stub session for shell
                  development.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3">
            <Button type="submit" className="w-full">
              Continue
              <ArrowRight data-icon="inline-end" />
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              New here? Complete onboarding after you continue.
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
