import type { Id } from "../../../convex/_generated/dataModel"

/**
 * Demo Convex `users` id for task API calls.
 *
 * Stub auth (`src/lib/auth.tsx`) stores a random UUID that is **not** a Convex
 * `Id<"users">`. Until Convex Auth lands, the tasks screen keeps a separate
 * localStorage key for the real Convex user id.
 *
 * ## How to get a working userId
 *
 * 1. Seed demo data (creates Ada Lovelace):
 *    `npx convex run seed:seedDemo`
 * 2. Copy the returned `userId` (Ada's id) from the CLI output.
 * 3. Paste it into the "Convex user id" field on `/dashboard/tasks`, or set:
 *    `localStorage.setItem("agamotto.convex-user-id", "<userId>")`
 *
 * Ada's seeded email is `ada@agamotto.dev` (no client lookup query exists yet;
 * paste the id from the seed response).
 */

export const CONVEX_USER_ID_STORAGE_KEY = "agamotto.convex-user-id"

/** Loose check — Convex ids are opaque strings; reject empties / stub UUIDs shape is ok if pasted wrong. */
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
