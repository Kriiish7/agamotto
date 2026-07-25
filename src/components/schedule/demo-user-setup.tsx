import * as React from "react"
import { CaretDownIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { isPlausibleConvexId } from "./demo-user-id"

type DemoUserSetupProps = {
  userId: string | null
  onSave: (userId: string) => void
  onClear: () => void
}

/**
 * Dev-only Convex userId bridge. Kept out of the Schedule first viewport —
 * Generate + Timeline own the composition; this lives in a collapsible strip.
 */
export function DemoUserSetup({ userId, onSave, onClear }: DemoUserSetupProps) {
  const [draft, setDraft] = React.useState(userId ?? "")
  const [error, setError] = React.useState<string | null>(null)
  // Expand when unset so the user can paste without hunting; collapse when set.
  const [open, setOpen] = React.useState(() => !userId)

  React.useEffect(() => {
    setDraft(userId ?? "")
    if (!userId) setOpen(true)
  }, [userId])

  function handleSave(event: React.FormEvent) {
    event.preventDefault()
    if (!isPlausibleConvexId(draft)) {
      setError("Paste the Convex userId from `npx convex run seed:seedDemo`.")
      return
    }
    setError(null)
    onSave(draft.trim())
    setOpen(false)
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60"
    >
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs text-zinc-600",
          "hover:bg-zinc-100/80",
        )}
      >
        <span className="font-medium text-zinc-700">
          Demo Convex user
          {userId ? (
            <span className="ml-2 font-mono font-normal text-zinc-500">
              {userId.slice(0, 8)}…
            </span>
          ) : (
            <span className="ml-2 font-normal text-amber-800">
              required to generate
            </span>
          )}
        </span>
        <CaretDownIcon
          className={cn(
            "size-3.5 shrink-0 text-zinc-500 transition-transform",
            open && "rotate-180",
          )}
          weight="bold"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-dashed border-zinc-200 px-3 py-3">
        {userId ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-xs break-all text-zinc-600">{userId}</p>
            <Button type="button" variant="outline" size="sm" onClick={onClear}>
              Clear
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs leading-relaxed text-zinc-600">
              Stub auth does not map to Convex yet. Run{" "}
              <code className="text-[0.7rem]">npx convex run seed:seedDemo</code>
              , copy Ada&apos;s returned{" "}
              <code className="text-[0.7rem]">userId</code>, and paste it here.
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
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
