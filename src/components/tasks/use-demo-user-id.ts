import * as React from "react"

import type { Id } from "../../../convex/_generated/dataModel"
import {
  isPlausibleConvexId,
  readDemoUserId,
  writeDemoUserId,
} from "./demo-user-id"

export function useDemoUserId() {
  const [userId, setUserIdState] = React.useState<Id<"users"> | null>(null)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    setUserIdState(readDemoUserId())
    setReady(true)
  }, [])

  const setUserId = React.useCallback((next: string | null) => {
    if (next == null || next.trim() === "") {
      writeDemoUserId(null)
      setUserIdState(null)
      return
    }
    if (!isPlausibleConvexId(next)) return
    writeDemoUserId(next)
    setUserIdState(next.trim() as Id<"users">)
  }, [])

  return { userId, setUserId, ready }
}
