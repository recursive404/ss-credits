/**
 * Ticker.ts - Game loop with delta time (Bruno pattern)
 * Manages frame-synchronized updates
 */

type TickCallback = (delta: number) => void

export class Ticker {
  private callbacks: TickCallback[] = []
  private lastTime = 0
  private isRunning = false

  constructor() {
    this.start()
  }

  subscribe(callback: TickCallback): void {
    this.callbacks.push(callback)
  }

  unsubscribe(callback: TickCallback): void {
    const index = this.callbacks.indexOf(callback)
    if (index > -1) {
      this.callbacks.splice(index, 1)
    }
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.lastTime = performance.now()
    this.tick()
  }

  stop(): void {
    this.isRunning = false
  }

  private tick = (): void => {
    if (!this.isRunning) return

    const now = performance.now()
    const delta = Math.min((now - this.lastTime) / 1000, 0.1) // Cap at 100ms
    this.lastTime = now

    // Call all subscribers
    for (const callback of this.callbacks) {
      callback(delta)
    }

    requestAnimationFrame(this.tick)
  }
}
