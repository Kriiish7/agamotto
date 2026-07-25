import * as React from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { isPlausibleConvexId } from "./demo-user-id"

type DemoUserSetupProps = {
  userId: string | null
  onSave: (userId: string) => void
  onClear: () => void
}

/** Maps stub session → Convex schedules API via Ada's seeded `userId`. */
export function DemoUserSetup({ userId, onSave, onClear }: DemoUserSetupProps) {
  const [draft, setDraft] = React.useState(userId ?? "")
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    setDraft(userId ?? "")
  }, [userId])

  function handleSave(event: React.FormEvent) {
    event.preventDefault()
    if (!isPlausibleConvexId(draft)) {
      setError("Paste the Convex userId from `npx convex run seed:seedDemo`.")
      return
    }
    setError(null)
    onSave(draft.trim())
  }

  if (userId) {
    return (
      <Alert>
        <AlertTitle>Demo Convex user</AlertTitle>
        <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-xs break-all">{userId}</span>
          <Button type="button" variant="outline" size="sm" onClick={onClear}>
            Clear
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert>
      <AlertTitle>Connect a Convex userId</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Stub auth does not map to Convex yet. Run{" "}
          <code className="text-[0.7rem]">npx convex run seed:seedDemo</code>,
          copy Ada&apos;s returned <code className="text-[0.7rem]">userId</code>
          , and paste it here (stored as{" "}
          <code className="text-[0.7rem]">agamotto.convex-user-id</code>).
        </p>
        <form
          onSubmit={handleSave}
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
        >
          <Field className="flex-1">
            <FieldLabel htmlFor="schedule-convex-user-id">
              Convex user id
            </FieldLabel>
            <Input
              id="schedule-convex-user-id"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="j57…"
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <Button type="submit">Save</Button>
        </form>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
