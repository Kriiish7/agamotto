/**
 * Lightweight natural-language-ish parser for the quick-add bar.
 * Imperfect by design — extracts duration / priority / deadline / category
 * heuristics and leaves the remainder as the title.
 */

export type ParsedTaskInput = {
  title: string
  durationMinutes: number
  priority: number
  /** Unix ms deadline, when a heuristic matched. */
  deadline?: number
  category: string
}

const DEFAULTS = {
  durationMinutes: 30,
  priority: 3,
  category: "general",
} as const

const DAY_NAMES: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
}

function clampPriority(n: number): number {
  if (!Number.isFinite(n)) return DEFAULTS.priority
  return Math.min(5, Math.max(1, Math.round(n)))
}

function endOfLocalDay(date: Date): number {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

function nextWeekday(targetDow: number, from = new Date()): Date {
  const d = new Date(from)
  d.setHours(0, 0, 0, 0)
  const delta = (targetDow - d.getDay() + 7) % 7 || 7
  d.setDate(d.getDate() + delta)
  return d
}

function parseDurationToken(raw: string): number | null {
  const m = raw
    .trim()
    .toLowerCase()
    .match(/^(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours)$/)
  if (!m) return null
  const value = Number(m[1])
  if (!Number.isFinite(value) || value <= 0) return null
  const unit = m[2]!
  if (unit.startsWith("h")) return Math.round(value * 60)
  return Math.round(value)
}

/**
 * Parse a quick-add string into task fields.
 *
 * Examples:
 * - `Ship landing page for 2h p4 due friday #engineering`
 * - `Write brief 45m priority 5 by tomorrow`
 * - `Quick call !1 15min`
 */
export function parseTaskInput(
  input: string,
  now = Date.now(),
): ParsedTaskInput {
  let remaining = input.trim()
  if (!remaining) {
    return {
      title: "",
      durationMinutes: DEFAULTS.durationMinutes,
      priority: DEFAULTS.priority,
      category: DEFAULTS.category,
    }
  }

  let durationMinutes: number | undefined
  let priority: number | undefined
  let deadline: number | undefined
  let category: string | undefined

  // Category: #tag or cat:name / category:name
  remaining = remaining.replace(
    /(?:^|\s)(?:#([\w-]+)|(?:cat|category):([\w-]+))/gi,
    (_match, hashTag: string | undefined, named: string | undefined) => {
      category = (hashTag ?? named ?? "").toLowerCase()
      return " "
    },
  )

  // Priority: p1–p5, !1–!5, priority N
  remaining = remaining.replace(
    /(?:^|\s)(?:p([1-5])|!([1-5])|priority\s*([1-5]))\b/gi,
    (_match, a: string | undefined, b: string | undefined, c: string | undefined) => {
      priority = clampPriority(Number(a ?? b ?? c))
      return " "
    },
  )

  // Duration: "for 2h", "45m", "30 min", standalone tokens
  remaining = remaining.replace(
    /(?:^|\s)(?:for\s+)?(\d+(?:\.\d+)?\s*(?:m|min|mins|minute|minutes|h|hr|hrs|hour|hours))\b/gi,
    (_match, token: string) => {
      const mins = parseDurationToken(token)
      if (mins != null) durationMinutes = mins
      return " "
    },
  )

  // Deadline: due/by tomorrow|today|<weekday>|YYYY-MM-DD
  remaining = remaining.replace(
    /(?:^|\s)(?:due|by)\s+(tomorrow|today|[\w-]+|\d{4}-\d{2}-\d{2})\b/gi,
    (_match, token: string) => {
      const key = token.toLowerCase()
      const base = new Date(now)
      if (key === "today") {
        deadline = endOfLocalDay(base)
      } else if (key === "tomorrow") {
        const d = new Date(base)
        d.setDate(d.getDate() + 1)
        deadline = endOfLocalDay(d)
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
        const d = new Date(`${key}T23:59:59.999`)
        if (!Number.isNaN(d.getTime())) deadline = d.getTime()
      } else if (key in DAY_NAMES) {
        deadline = endOfLocalDay(nextWeekday(DAY_NAMES[key]!, base))
      }
      return " "
    },
  )

  const title = remaining.replace(/\s+/g, " ").trim()

  return {
    title,
    durationMinutes: durationMinutes ?? DEFAULTS.durationMinutes,
    priority: priority ?? DEFAULTS.priority,
    deadline,
    category: category ?? DEFAULTS.category,
  }
}
