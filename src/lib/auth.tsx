import * as React from "react"

/**
 * TODO: Replace stub auth with Convex Auth (or another real provider).
 * This localStorage session is only for shell/onboarding wiring until auth lands.
 */

const AUTH_STORAGE_KEY = "agamotto.stub-session"

export type StubUser = {
  id: string
  name: string
  email: string
  onboarded: boolean
}

type AuthContextValue = {
  user: StubUser | null
  isLoading: boolean
  signIn: (input: { name: string; email: string }) => void
  completeOnboarding: () => void
  signOut: () => void
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

function readStoredUser(): StubUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StubUser
  } catch {
    return null
  }
}

function writeStoredUser(user: StubUser | null) {
  if (typeof window === "undefined") return
  if (!user) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<StubUser | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    setUser(readStoredUser())
    setIsLoading(false)
  }, [])

  const signIn = React.useCallback((input: { name: string; email: string }) => {
    const next: StubUser = {
      id: crypto.randomUUID(),
      name: input.name.trim() || "Explorer",
      email: input.email.trim().toLowerCase(),
      onboarded: false,
    }
    writeStoredUser(next)
    setUser(next)
  }, [])

  const completeOnboarding = React.useCallback(() => {
    setUser((current) => {
      if (!current) return current
      const next = { ...current, onboarded: true }
      writeStoredUser(next)
      return next
    })
  }, [])

  const signOut = React.useCallback(() => {
    writeStoredUser(null)
    setUser(null)
  }, [])

  const value = React.useMemo(
    () => ({ user, isLoading, signIn, completeOnboarding, signOut }),
    [user, isLoading, signIn, completeOnboarding, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
