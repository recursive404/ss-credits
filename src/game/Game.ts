/**
 * Game.ts - Singleton orchestrator (Bruno pattern)
 * Central game class that manages all systems
 */

import * as THREE from 'three'
import { Ticker } from './Ticker'
import { Scene } from './Scene'
import { PlayerTargets } from './PlayerTargets'
import { Rail } from './Rail'
import { HUD } from './HUD'
import { fetchTopPlayers } from '../api/ScoreSaber'

class Game {
  private static instance: Game | null = null

  public ticker!: Ticker
  public scene!: Scene
  public targets!: PlayerTargets
  public rail!: Rail
  public hud!: HUD

  public score = 0
  public streak = 0
  public isPlaying = false

  private constructor() {}

  static getInstance(): Game {
    if (!Game.instance) {
      Game.instance = new Game()
    }
    return Game.instance
  }

  async init(): Promise<void> {
    console.log('🎮 SS-Credits Game initializing...')

    // Initialize systems in order
    this.ticker = new Ticker()
    this.scene = new Scene()
    this.hud = new HUD()
    this.rail = new Rail()
    this.targets = new PlayerTargets()

    // Load player data
    console.log('📡 Fetching ScoreSaber data...')
    const players = await fetchTopPlayers(200)
    console.log(`✅ Loaded ${players.length} players`)

    // Initialize targets with player data
    this.targets.setPlayers(players)

    // Set up click handler for shooting
    this.setupInput()

    // Subscribe to tick
    this.ticker.subscribe(this.update.bind(this))

    console.log('🚀 Game ready! Click to start.')
    this.hud.showMessage('Click to Start', 3000)
  }

  private setupInput(): void {
    const canvas = this.scene.renderer.domElement

    canvas.addEventListener('click', (e) => {
      if (!this.isPlaying) {
        this.start()
        return
      }

      this.shoot(e.clientX, e.clientY)
    })

    // Track mouse for crosshair
    canvas.addEventListener('mousemove', (e) => {
      this.hud.updateCrosshair(e.clientX, e.clientY)
    })
  }

  start(): void {
    this.isPlaying = true
    this.score = 0
    this.streak = 0
    this.rail.start()
    this.targets.start()
    this.hud.hideMessage()
    console.log('🎬 Game started!')
  }

  private shoot(x: number, y: number): void {
    // Convert screen coords to normalized device coords
    const ndc = new THREE.Vector2(
      (x / window.innerWidth) * 2 - 1,
      -(y / window.innerHeight) * 2 + 1
    )

    // Raycast to find hit targets
    const hit = this.targets.checkHit(ndc, this.scene.camera)

    if (hit) {
      this.streak++
      const points = 1 + Math.floor(this.streak / 5) // Bonus points for streaks
      this.score += points
      this.hud.showHit(hit.name, points, x, y)
      console.log(`💥 Hit: ${hit.name} (+${points}) Streak: ${this.streak}`)
    } else {
      this.streak = 0
    }

    this.hud.updateScore(this.score, this.streak)
  }

  private update(delta: number): void {
    if (!this.isPlaying) return

    this.rail.update(delta)
    this.targets.update(delta)

    // Check if game is over (rail finished)
    if (this.rail.isFinished) {
      this.gameOver()
    }
  }

  private gameOver(): void {
    this.isPlaying = false
    this.hud.showMessage(`Game Over! Score: ${this.score}`, 5000)
    console.log(`🏁 Game Over! Final Score: ${this.score}`)
  }
}

export const game = Game.getInstance()
