import { createFileRoute, Navigate } from "@tanstack/react-router"

import { AuthLoading } from "@/components/auth-gate"
import { useAuth } from "@/lib/auth"

export const Route = createFileRoute("/")({ component: HomeRedirect })

function HomeRedirect() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <AuthLoading />
  if (!user) return <Navigate to="/login" />
  if (!user.onboarded) return <Navigate to="/onboarding" />
  return <Navigate to="/dashboard" />
}
