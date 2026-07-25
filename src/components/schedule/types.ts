export type DeferredItem = {
  taskId: string
  title: string
  reason: string
}

export type GenerationMeta = {
  mode: "serenity" | "crunch"
  delayed: DeferredItem[]
  excluded: DeferredItem[]
  blockCount: number
}
