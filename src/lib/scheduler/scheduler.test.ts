import { describe, expect, it } from "vitest"
import {
  knapsackSelect,
  schedule,
  scheduleCrunch,
  scheduleSerenity,
  selectMode,
} from "./index"
import type { Block, Task, Window } from "./types"

function assertExplanations(blocks: Block[]) {
  for (const block of blocks) {
    expect(block.explanation.trim().length).toBeGreaterThan(10)
    expect(block.explanation).toContain(block.title)
    expect(block.explanation).not.toMatch(/Error:|at Object\.|TypeError/)
  }
}

const mondayMorning: Window = {
  id: "w-mon-am",
  start: "2026-07-27T09:00:00.000Z",
  end: "2026-07-27T12:00:00.000Z",
}

const mondayAfternoon: Window = {
  id: "w-mon-pm",
  start: "2026-07-27T13:00:00.000Z",
  end: "2026-07-27T17:00:00.000Z",
}

describe("selectMode", () => {
  it("chooses serenity when work fits available windows", () => {
    const tasks: Task[] = [
      {
        id: "t1",
        title: "Read chapter",
        estimatedHours: 2,
        priority: 5,
      },
    ]
    expect(selectMode(tasks, [mondayMorning])).toBe("serenity")
  })

  it("chooses crunch when work overflows available windows", () => {
    const tasks: Task[] = [
      {
        id: "t1",
        title: "Essay",
        estimatedHours: 4,
        priority: 8,
        deadline: "2026-07-28T00:00:00.000Z",
      },
      {
        id: "t2",
        title: "Lab write-up",
        estimatedHours: 3,
        priority: 6,
        deadline: "2026-07-29T00:00:00.000Z",
      },
    ]
    expect(selectMode(tasks, [mondayMorning])).toBe("crunch")
  })
})

describe("Serenity — fits-in-time happy path", () => {
  it("places every task when total effort fits, with specific explanations", () => {
    const tasks: Task[] = [
      {
        id: "essay",
        title: "Essay intro",
        estimatedHours: 2,
        priority: 9,
        deadline: "2026-07-28T00:00:00.000Z",
      },
      {
        id: "flashcards",
        title: "Flashcards",
        estimatedHours: 1,
        priority: 4,
        deadline: "2026-08-01T00:00:00.000Z",
      },
    ]
    const windows = [mondayMorning, mondayAfternoon]
    expect(selectMode(tasks, windows)).toBe("serenity")

    const result = scheduleSerenity(tasks, windows)
    expect(result.mode).toBe("serenity")
    expect(result.excluded).toHaveLength(0)
    expect(result.delayed).toHaveLength(0)

    const placedIds = new Set(result.blocks.map((b) => b.taskId))
    expect(placedIds).toEqual(new Set(["essay", "flashcards"]))

    const essayBlocks = result.blocks.filter((b) => b.taskId === "essay")
    expect(essayBlocks[0]!.start < result.blocks.find((b) => b.taskId === "flashcards")!.start).toBe(
      true,
    )

    assertExplanations(result.blocks)
    expect(essayBlocks[0]!.explanation.toLowerCase()).toMatch(
      /deadline|priority|first|ranks/,
    )
  })

  it("splits a long task across windows into sessions", () => {
    const tasks: Task[] = [
      {
        id: "deep",
        title: "Deep work sprint",
        estimatedHours: 5,
        priority: 8,
        deadline: "2026-07-30T00:00:00.000Z",
      },
    ]
    // 3h + 4h = 7h available
    const result = scheduleSerenity(tasks, [mondayMorning, mondayAfternoon])
    expect(result.blocks.length).toBeGreaterThan(1)
    expect(result.blocks.every((b) => b.taskId === "deep")).toBe(true)
    expect(result.blocks[0]!.sessionCount).toBe(result.blocks.length)
    assertExplanations(result.blocks)
    expect(result.blocks.some((b) => /session|split/i.test(b.explanation))).toBe(
      true,
    )
  })
})

describe("Crunch — overflow / knapsack correctness", () => {
  it("selects the higher-value subset under the time budget", () => {
    // 3 hours available.
    const windows = [mondayMorning]
    const tasks: Task[] = [
      {
        id: "a",
        title: "Urgent essay",
        estimatedHours: 2,
        priority: 10,
        deadline: "2026-07-27T18:00:00.000Z",
      },
      {
        id: "b",
        title: "Nice-to-have reading",
        estimatedHours: 2,
        priority: 3,
        deadline: "2026-08-15T00:00:00.000Z",
      },
      {
        id: "c",
        title: "Quick review",
        estimatedHours: 1,
        priority: 7,
        deadline: "2026-07-28T00:00:00.000Z",
      },
    ]

    expect(selectMode(tasks, windows)).toBe("crunch")
    const result = scheduleCrunch(tasks, windows)
    expect(result.mode).toBe("crunch")

    const placed = new Set(result.blocks.map((b) => b.taskId))
    // Optimal: A (2h, high) + C (1h) = 3h; B is delayed.
    expect(placed.has("a")).toBe(true)
    expect(placed.has("c")).toBe(true)
    expect(placed.has("b")).toBe(false)
    expect(result.delayed.some((d) => d.taskId === "b")).toBe(true)

    assertExplanations(result.blocks)
    expect(result.blocks[0]!.explanation.toLowerCase()).toMatch(
      /crunch|deadline|budget/,
    )
  })

  it("knapsackSelect reconstructs an optimal subset", () => {
    const items = [
      { weight: 2, value: 10 },
      { weight: 2, value: 3 },
      { weight: 1, value: 7 },
    ]
    const selected = knapsackSelect(items, 3)
    const ids = selected.sort()
    expect(ids).toEqual([0, 2])
  })
})

describe("dependency ordering", () => {
  it("places dependencies before dependents", () => {
    const tasks: Task[] = [
      {
        id: "outline",
        title: "Outline",
        estimatedHours: 1,
        priority: 5,
        deadline: "2026-07-29T00:00:00.000Z",
      },
      {
        id: "draft",
        title: "Draft",
        estimatedHours: 2,
        priority: 9,
        deadline: "2026-07-28T00:00:00.000Z",
        dependsOn: ["outline"],
      },
    ]
    const result = scheduleSerenity(tasks, [mondayMorning, mondayAfternoon])
    const outlineEnd = result.blocks.find((b) => b.taskId === "outline")!.end
    const draftStart = result.blocks.find((b) => b.taskId === "draft")!.start
    expect(Date.parse(draftStart)).toBeGreaterThanOrEqual(Date.parse(outlineEnd))
    assertExplanations(result.blocks)
  })
})

describe("zero-availability edge case", () => {
  it("excludes everything when there are no usable windows", () => {
    const tasks: Task[] = [
      {
        id: "t1",
        title: "Anything",
        estimatedHours: 1,
        priority: 5,
      },
    ]
    const result = schedule(tasks, [])
    expect(result.blocks).toHaveLength(0)
    expect(result.excluded.length + result.delayed.length).toBeGreaterThan(0)
    expect(result.excluded[0]?.reason.trim().length).toBeGreaterThan(10)
  })
})

describe("oversized-task edge case", () => {
  it("excludes a task larger than the entire availability budget in crunch", () => {
    const tasks: Task[] = [
      {
        id: "huge",
        title: "Thesis chapter",
        estimatedHours: 10,
        priority: 10,
        deadline: "2026-07-28T00:00:00.000Z",
      },
      {
        id: "small",
        title: "Email tutor",
        estimatedHours: 1,
        priority: 4,
        deadline: "2026-07-29T00:00:00.000Z",
      },
    ]
    const result = scheduleCrunch(tasks, [mondayMorning])
    expect(result.excluded.some((e) => e.taskId === "huge")).toBe(true)
    expect(result.excluded.find((e) => e.taskId === "huge")!.reason).toMatch(
      /Thesis chapter/,
    )
    expect(result.blocks.some((b) => b.taskId === "small")).toBe(true)
    assertExplanations(result.blocks)
  })
})
