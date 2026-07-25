import { cn } from "@/lib/utils"

type StatusBreakdownProps<T extends string> = {
  title: string
  description?: string
  order: readonly T[]
  counts: Record<T, number>
  labels: Record<T, string>
  tones: Record<T, string>
  emptyMessage?: string
}

export function StatusBreakdown<T extends string>({
  title,
  description,
  order,
  counts,
  labels,
  tones,
  emptyMessage = "No items yet.",
}: StatusBreakdownProps<T>) {
  const total = order.reduce((sum, status) => sum + (counts[status] ?? 0), 0)

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-medium">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {total === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <>
          <div
            className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={`${title}: ${total} total`}
          >
            {order.map((status) => {
              const count = counts[status] ?? 0
              if (count === 0) return null
              const pct = (count / total) * 100
              return (
                <div
                  key={status}
                  className={cn("h-full min-w-0 transition-[width]", tones[status])}
                  style={{ width: `${pct}%` }}
                  title={`${labels[status]}: ${count} (${pct.toFixed(0)}%)`}
                />
              )
            })}
          </div>

          <ul className="space-y-2">
            {order.map((status) => {
              const count = counts[status] ?? 0
              const pct = total === 0 ? 0 : (count / total) * 100
              return (
                <li
                  key={status}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "size-2.5 shrink-0 rounded-full",
                        tones[status],
                      )}
                      aria-hidden
                    />
                    <span className="truncate">{labels[status]}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {count}
                    <span className="ml-2 text-xs">({pct.toFixed(0)}%)</span>
                  </span>
                </li>
              )
            })}
          </ul>

          <p className="text-xs text-muted-foreground tabular-nums">
            {total} total
          </p>
        </>
      )}
    </section>
  )
}
