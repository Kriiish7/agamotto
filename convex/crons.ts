import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

/**
 * Convex cron registry (required filename for Convex to pick up jobs).
 * Reminder logic lives in `notifications.ts` — this file only wires schedules.
 */
const crons = cronJobs()

// Hourly stub: upcoming blocks + overdue tasks → email stub.
crons.interval(
  "check reminders (upcoming blocks + overdue tasks)",
  { hours: 1 },
  internal.notifications.checkReminders,
  {},
)

export default crons
