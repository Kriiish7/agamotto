import * as React from "react"
import { Navigate } from "@tanstack/react-router"

import { useAuth } from "@/lib/auth"

export function AuthLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 text-sm text-muted-foreground">
      Loading…
    </div>
  )
}

/** Client-side gate until Convex Auth replaces stub sessions. */
export function RequireAuth({
  children,
  requireOnboarded = false,
}: {
  children: React.ReactNode
  requireOnboarded?: boolean
}) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <AuthLoading />
  if (!user) return <Navigate to="/login" />
  if (requireOnboarded && !user.onboarded) {
    return <Navigate to="/onboarding" />
  }

  return children
}

export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <AuthLoading />
  if (user?.onboarded) return <Navigate to="/dashboard" />
  if (user && !user.onboarded) return <Navigate to="/onboarding" />

  return children
}
