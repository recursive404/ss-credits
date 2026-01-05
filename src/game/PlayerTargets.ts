/**
 * PlayerTargets.ts - Flying player name targets
 * PFP-focused targets with red/blue colors and pulsating borders
 */

import * as THREE from 'three'
import { game } from './Game'

export type TargetColor = 'red' | 'blue'

export interface Player {
  name: string
  rank: number
  country: string
  pp: string
  countryRank: number
  profilePicture: string
  color: TargetColor
}

interface Target {
  mesh: THREE.Sprite
  player: Player
  velocity: THREE.Vector3
  alive: boolean
  avatarImage?: HTMLImageElement
  spawnTime: number
}

interface NamePopup {
  mesh: THREE.Sprite
  velocity: THREE.Vector3
  lifetime: number
  opacity: number
}

// Beat Saber colors
const COLORS = {
  red: { main: '#ff3366', glow: '#ff6b6b', dark: '#c92a2a' },
  blue: { main: '#3366ff', glow: '#74c0fc', dark: '#1971c2' }
}

export class PlayerTargets {
  private players: Player[] = []
  private targets: Target[] = []
  private namePopups: NamePopup[] = []
  private avatarCache: Map<string, HTMLImageElement> = new Map()
  private spawnTimer = 0
  private spawnInterval = 0.5 // seconds between spawns (slower)
  private playerIndex = 0
  private gameTime = 0

  setPlayers(players: Player[]): void {
    this.players = players
    this.preloadAvatars()
  }

  private async preloadAvatars(): Promise<void> {
    console.log('🖼️ Pre-loading player avatars...')
    const loadPromises = this.players.slice(0, 50).map(player => this.loadAvatar(player.profilePicture))
    await Promise.allSettled(loadPromises)
    console.log(`✅ Loaded ${this.avatarCache.size} avatars`)
  }

  private loadAvatar(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      if (this.avatarCache.has(url)) {
        resolve(this.avatarCache.get(url)!)
        return
      }

      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        this.avatarCache.set(url, img)
        resolve(img)
      }
      img.onerror = reject
      img.src = url
    })
  }

  start(): void {
    this.targets = []
    this.namePopups = []
    this.playerIndex = 0
    this.spawnTimer = 0
    this.gameTime = 0
  }

  update(delta: number): void {
    this.gameTime += delta
    this.spawnTimer += delta

    // Spawn new targets
    if (this.spawnTimer >= this.spawnInterval && this.playerIndex < this.players.length) {
      this.spawnTarget()
      this.spawnTimer = 0
    }

    // Update existing targets
    for (const target of this.targets) {
      if (!target.alive) continue

      // Move towards camera (SLOWER velocity)
      target.mesh.position.add(target.velocity.clone().multiplyScalar(delta))

      // Update pulsating border by regenerating texture
      this.updateTargetPulse(target)

      // Check if passed camera
      if (target.mesh.position.z > 5) {
        this.removeTarget(target, false)
      }
    }

    // Update name popups (floating names after hit)
    for (let i = this.namePopups.length - 1; i >= 0; i--) {
      const popup = this.namePopups[i]
      popup.lifetime -= delta
      popup.opacity = Math.max(0, popup.lifetime / 1.5)

      popup.mesh.position.add(popup.velocity.clone().multiplyScalar(delta))
      popup.mesh.scale.multiplyScalar(1 + delta * 0.3)
      ;(popup.mesh.material as THREE.SpriteMaterial).opacity = popup.opacity

      if (popup.lifetime <= 0) {
        game.scene.scene.remove(popup.mesh)
        ;(popup.mesh.material as THREE.SpriteMaterial).dispose()
        this.namePopups.splice(i, 1)
      }
    }
  }

  private updateTargetPulse(target: Target): void {
    // Pulse synchronized across all targets (will sync to BPM later)
    const pulse = Math.sin(this.gameTime * 4) * 0.5 + 0.5 // 0-1 pulse
    const material = target.mesh.material as THREE.SpriteMaterial
    // Modulate opacity slightly for pulse effect
    material.opacity = 0.9 + pulse * 0.1
  }

  private spawnTarget(): void {
    const player = this.players[this.playerIndex++]
    const avatarImage = this.avatarCache.get(player.profilePicture)
    const colors = COLORS[player.color]

    // Create PFP-focused circular target
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const size = 256
    canvas.width = size
    canvas.height = size

    const centerX = size / 2
    const centerY = size / 2
    const radius = size / 2 - 20

    // Draw pulsating glow border
    const pulse = Math.sin(this.gameTime * 4) * 0.5 + 0.5
    ctx.shadowColor = colors.glow
    ctx.shadowBlur = 20 + pulse * 15

    // Outer colored ring (pulsating)
    ctx.strokeStyle = colors.main
    ctx.lineWidth = 8 + pulse * 4
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.stroke()

    // Reset shadow for avatar
    ctx.shadowBlur = 0

    // Draw avatar circle
    if (avatarImage) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius - 10, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(avatarImage, 20, 20, size - 40, size - 40)
      ctx.restore()
    } else {
      // Placeholder circle
      ctx.fillStyle = colors.dark
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius - 10, 0, Math.PI * 2)
      ctx.fill()
    }

    // Inner border
    ctx.strokeStyle = colors.glow
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius - 10, 0, Math.PI * 2)
    ctx.stroke()

    // Small rank badge at bottom
    ctx.fillStyle = 'rgba(0,0,0,0.8)'
    ctx.beginPath()
    ctx.arc(centerX, size - 30, 25, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 18px "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`#${player.rank}`, centerX, size - 30)

    // Create texture and sprite
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false
    })

    const sprite = new THREE.Sprite(material)
    sprite.scale.set(4, 4, 1) // Square PFP

    // Random spawn position in tunnel
    const angle = Math.random() * Math.PI * 2
    const spawnRadius = Math.random() * 12 + 5
    sprite.position.set(
      Math.cos(angle) * spawnRadius,
      Math.sin(angle) * spawnRadius,
      -120 - Math.random() * 40
    )

    // SLOWER velocity
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 5,
      12 + Math.random() * 8 // Much slower: was 30-50, now 12-20
    )

    const target: Target = {
      mesh: sprite,
      player,
      velocity,
      alive: true,
      avatarImage,
      spawnTime: this.gameTime
    }

    this.targets.push(target)
    game.scene.scene.add(sprite)

    // Lazy load avatar for next players
    if (this.playerIndex < this.players.length) {
      this.loadAvatar(this.players[this.playerIndex].profilePicture).catch(() => {})
    }
  }

  private removeTarget(target: Target, spawnPopup: boolean = true): void {
    target.alive = false
    const position = target.mesh.position.clone()
    game.scene.scene.remove(target.mesh)
    ;(target.mesh.material as THREE.SpriteMaterial).dispose()

    // Spawn name popup (instead of avatar soul)
    if (spawnPopup) {
      this.spawnNamePopup(target.player, position)
    }
  }

  private spawnNamePopup(player: Player, position: THREE.Vector3): void {
    const colors = COLORS[player.color]

    // Create name text sprite
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = 512
    canvas.height = 128

    // Name text with glow
    ctx.shadowColor = colors.glow
    ctx.shadowBlur = 15
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 42px "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const flag = this.getFlag(player.country)
    ctx.fillText(`${flag} ${player.name}`, canvas.width / 2, 50)

    // PP text
    ctx.font = '24px "Segoe UI", sans-serif'
    ctx.fillStyle = colors.main
    ctx.fillText(`${parseFloat(player.pp).toLocaleString()}pp`, canvas.width / 2, 95)

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    })

    const sprite = new THREE.Sprite(material)
    sprite.scale.set(6, 1.5, 1)
    sprite.position.copy(position)

    // Float upward with drift
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 3,
      6 + Math.random() * 3,
      (Math.random() - 0.5) * 3
    )

    const popup: NamePopup = {
      mesh: sprite,
      velocity,
      lifetime: 1.5,
      opacity: 1
    }

    this.namePopups.push(popup)
    game.scene.scene.add(sprite)
  }

  // Check hit with specific color requirement
  checkHit(position: THREE.Vector3, shotColor: TargetColor): { player: Player; correct: boolean } | null {
    // Find closest target within hit radius
    const hitRadius = 3

    for (const target of this.targets) {
      if (!target.alive) continue

      const distance = target.mesh.position.distanceTo(position)
      if (distance < hitRadius) {
        const correct = target.player.color === shotColor
        this.removeTarget(target, true)
        return { player: target.player, correct }
      }
    }

    return null
  }

  // Get all alive targets for projectile collision
  getAliveTargets(): Target[] {
    return this.targets.filter(t => t.alive)
  }

  private getFlag(countryCode: string): string {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  }
}
