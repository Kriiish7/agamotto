/** Local calendar helpers for the schedule timeline (no timezone libs). */

export function startOfLocalDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function endOfLocalDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

/** YYYY-MM-DD for `<input type="date">`. */
export function toDateInputValue(ms: number): string {
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Parse YYYY-MM-DD as local midnight. */
export function fromDateInputValue(value: string): number {
  const [y, m, d] = value.split("-").map(Number)
  if (!y || !m || !d) return NaN
  return new Date(y, m - 1, d).getTime()
}

/** datetime-local value from unix ms. */
export function toDateTimeLocalValue(ms: number): string {
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const h = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${y}-${m}-${day}T${h}:${min}`
}

export function fromDateTimeLocalValue(value: string): number {
  const t = Date.parse(value)
  return Number.isFinite(t) ? t : NaN
}

export function formatDayHeading(ms: number): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(ms))
}

export function formatTimeRange(start: number, end: number): string {
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  }
  const a = new Intl.DateTimeFormat(undefined, opts).format(new Date(start))
  const b = new Intl.DateTimeFormat(undefined, opts).format(new Date(end))
  return `${a} – ${b}`
}

export function formatDurationMinutes(start: number, end: number): string {
  const mins = Math.max(0, Math.round((end - start) / 60_000))
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function eachLocalDay(rangeStart: number, rangeEnd: number): number[] {
  const days: number[] = []
  let cursor = startOfLocalDay(rangeStart)
  const last = startOfLocalDay(rangeEnd)
  while (cursor <= last) {
    days.push(cursor)
    cursor += 24 * 60 * 60 * 1000
  }
  return days
}

export function defaultRange(): { start: number; end: number } {
  const start = startOfLocalDay(Date.now())
  const end = endOfLocalDay(start + 6 * 24 * 60 * 60 * 1000)
  return { start, end }
}
