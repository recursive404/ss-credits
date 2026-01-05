/**
 * Game.ts - Singleton orchestrator (Bruno pattern)
 * Central game class that manages all systems
 */

import * as THREE from 'three'
import { Ticker } from './Ticker'
import { Scene } from './Scene'
import { PlayerTargets } from './PlayerTargets'
import type { TargetColor } from './PlayerTargets'
import { Rail } from './Rail'
import { HUD } from './HUD'
import { fetchTopPlayers } from '../api/ScoreSaber'

interface Projectile {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  color: TargetColor
  alive: boolean
}

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

  private projectiles: Projectile[] = []
  private mouseX = 0
  private mouseY = 0
  private targetCameraX = 0
  private targetCameraY = 0

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
    const players = await fetchTopPlayers(100)
    console.log(`✅ Loaded ${players.length} players`)

    // Initialize targets with player data
    this.targets.setPlayers(players)

    // Set up input handlers
    this.setupInput()

    // Subscribe to tick
    this.ticker.subscribe(this.update.bind(this))

    console.log('🚀 Game ready! Click to start.')
    this.hud.showMessage('Left Click = 🔴  Right Click = 🔵', 0)
  }

  private setupInput(): void {
    const canvas = this.scene.renderer.domElement

    // Left click = red shot
    canvas.addEventListener('click', (e) => {
      if (!this.isPlaying) {
        this.start()
        return
      }
      this.shoot(e.clientX, e.clientY, 'red')
    })

    // Right click = blue shot
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      if (!this.isPlaying) {
        this.start()
        return
      }
      this.shoot(e.clientX, e.clientY, 'blue')
    })

    // Track mouse for crosshair and camera parallax
    canvas.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX
      this.mouseY = e.clientY
      this.hud.updateCrosshair(e.clientX, e.clientY)

      // Calculate target camera offset for parallax
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      this.targetCameraX = ((e.clientX - centerX) / centerX) * 2 // -2 to 2
      this.targetCameraY = ((e.clientY - centerY) / centerY) * -1.5 // -1.5 to 1.5
    })
  }

  start(): void {
    this.isPlaying = true
    this.score = 0
    this.streak = 0
    this.projectiles = []
    this.rail.start()
    this.targets.start()
    this.hud.hideMessage()
    console.log('🎬 Game started!')
  }

  private shoot(screenX: number, screenY: number, color: TargetColor): void {
    // Convert screen coords to world position
    const ndc = new THREE.Vector2(
      (screenX / window.innerWidth) * 2 - 1,
      -(screenY / window.innerHeight) * 2 + 1
    )

    // Create projectile at camera position
    const camera = this.scene.camera
    const direction = new THREE.Vector3(ndc.x, ndc.y, 0.5)
      .unproject(camera)
      .sub(camera.position)
      .normalize()

    // Projectile geometry - small glowing sphere
    const geometry = new THREE.SphereGeometry(0.15, 8, 8)
    const colorHex = color === 'red' ? 0xff3366 : 0x3366ff
    const material = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.9
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(camera.position)

    // Add glow effect (larger transparent sphere)
    const glowGeometry = new THREE.SphereGeometry(0.3, 8, 8)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.3
    })
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    mesh.add(glow)

    const projectile: Projectile = {
      mesh,
      velocity: direction.multiplyScalar(80), // Fast projectile
      color,
      alive: true
    }

    this.projectiles.push(projectile)
    this.scene.scene.add(mesh)

    // Visual feedback on HUD
    this.hud.showShot(color, screenX, screenY)
  }

  private update(delta: number): void {
    // Always update camera parallax (even before game starts)
    this.updateCameraParallax(delta)

    if (!this.isPlaying) return

    this.rail.update(delta)
    this.targets.update(delta)
    this.updateProjectiles(delta)

    // Check if game is over (rail finished)
    if (this.rail.isFinished) {
      this.gameOver()
    }
  }

  private updateCameraParallax(delta: number): void {
    // Smooth interpolation toward target position
    const lerp = 1 - Math.pow(0.01, delta)
    const camera = this.scene.camera

    // Only apply parallax offset, rail controls main Z position
    const baseX = Math.sin(performance.now() * 0.0005) * 2 // Rail sway
    const baseY = Math.cos(performance.now() * 0.0003) * 1.5

    const targetX = baseX + this.targetCameraX
    const targetY = baseY + this.targetCameraY

    camera.position.x += (targetX - camera.position.x) * lerp * 0.3
    camera.position.y += (targetY - camera.position.y) * lerp * 0.3
  }

  private updateProjectiles(delta: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i]
      if (!proj.alive) continue

      // Move projectile
      proj.mesh.position.add(proj.velocity.clone().multiplyScalar(delta))

      // Check collision with targets
      const hit = this.targets.checkHit(proj.mesh.position, proj.color)
      if (hit) {
        this.onHit(hit.player, hit.correct, proj.mesh.position)
        this.removeProjectile(proj)
        continue
      }

      // Remove if too far
      if (proj.mesh.position.z < -200 || proj.mesh.position.z > 50) {
        this.removeProjectile(proj)
      }
    }
  }

  private onHit(player: { name: string }, correct: boolean, _position: THREE.Vector3): void {
    if (correct) {
      this.streak++
      const points = 1 + Math.floor(this.streak / 5)
      this.score += points
      this.hud.showHit(player.name, points, this.mouseX, this.mouseY)
      console.log(`✅ Correct! ${player.name} (+${points}) Streak: ${this.streak}`)
    } else {
      // Wrong color - break streak, no points
      this.streak = 0
      this.hud.showMiss('Wrong color!', this.mouseX, this.mouseY)
      console.log(`❌ Wrong color! ${player.name}`)
    }

    this.hud.updateScore(this.score, this.streak)
  }

  private removeProjectile(proj: Projectile): void {
    proj.alive = false
    this.scene.scene.remove(proj.mesh)
    proj.mesh.geometry.dispose()
    ;(proj.mesh.material as THREE.Material).dispose()
  }

  private gameOver(): void {
    this.isPlaying = false
    // Clean up remaining projectiles
    for (const proj of this.projectiles) {
      if (proj.alive) this.removeProjectile(proj)
    }
    this.projectiles = []

    this.hud.showMessage(`Game Over! Score: ${this.score}`, 5000)
    console.log(`🏁 Game Over! Final Score: ${this.score}`)
  }
}

export const game = Game.getInstance()
