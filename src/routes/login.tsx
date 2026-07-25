import * as React from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"

import { RedirectIfAuthed } from "@/components/auth-gate"
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
    <main className="flex min-h-svh items-center justify-center bg-[radial-gradient(ellipse_at_top,_oklch(0.97_0.02_264),_oklch(0.98_0_0)_55%)] p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Agamotto
          </p>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to continue. Auth is stubbed locally until Convex Auth is
            wired.
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
                  Any values work — this is a fake session for shell development.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3">
            <Button type="submit" className="w-full">
              Continue
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              New here?{" "}
              <Link to="/onboarding" className="underline underline-offset-4">
                Start onboarding
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
