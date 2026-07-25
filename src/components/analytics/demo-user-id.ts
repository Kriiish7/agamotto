import type { Id } from "../../../convex/_generated/dataModel"

/**
 * Demo Convex `users` id for analytics / schedules list queries.
 *
 * Stub auth (`src/lib/auth.tsx`) stores a random UUID that is **not** a Convex
 * `Id<"users">`. Until Convex Auth lands, screens share a localStorage key for
 * the real Convex user id (same key as the tasks screen).
 *
 * ## How to get a working userId
 *
 * 1. Seed (internal mutation; CLI works): `npx convex run seed:seedDemo`
 * 2. Copy the returned `userId` (Ada Lovelace).
 * 3. Paste it on this page, or set:
 *    `localStorage.setItem("agamotto.convex-user-id", "<userId>")`
 */

export const CONVEX_USER_ID_STORAGE_KEY = "agamotto.convex-user-id"

export function isPlausibleConvexId(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length >= 10 && !/\s/.test(trimmed)
}

export function readDemoUserId(): Id<"users"> | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(CONVEX_USER_ID_STORAGE_KEY)
    if (!raw || !isPlausibleConvexId(raw)) return null
    return raw.trim() as Id<"users">
  } catch {
    return null
  }
}

export function writeDemoUserId(userId: string | null) {
  if (typeof window === "undefined") return
  if (!userId || !isPlausibleConvexId(userId)) {
    window.localStorage.removeItem(CONVEX_USER_ID_STORAGE_KEY)
    return
  }
  window.localStorage.setItem(CONVEX_USER_ID_STORAGE_KEY, userId.trim())
}
