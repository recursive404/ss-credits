/**
 * Rail.ts - On-rails camera path
 * Moves camera through the tunnel like SSBM credits
 */

import { game } from './Game'

export class Rail {
  public isFinished = false
  private progress = 0
  private duration = 60 // seconds for full run
  private speed = 1

  // Path waypoints (simple linear path through tunnel)
  private pathLength = 400

  start(): void {
    this.progress = 0
    this.isFinished = false
    this.speed = 1
  }

  update(delta: number): void {
    if (this.isFinished) return

    this.progress += (delta * this.speed) / this.duration

    if (this.progress >= 1) {
      this.progress = 1
      this.isFinished = true
      return
    }

    // Move camera along path
    const z = -this.progress * this.pathLength
    game.scene.camera.position.z = z

    // Subtle sway for immersion
    const time = performance.now() * 0.001
    game.scene.camera.position.x = Math.sin(time * 0.5) * 2
    game.scene.camera.position.y = Math.cos(time * 0.3) * 1.5
  }

  // Speed up when player holds key (like SSBM Start button)
  setSpeed(multiplier: number): void {
    this.speed = multiplier
  }
}
