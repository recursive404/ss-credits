/**
 * PlayerTargets.ts - Flying player name targets
 * The main gameplay element - player names flying at camera
 */

import * as THREE from 'three'
import { game } from './Game'

export interface Player {
  name: string
  rank: number
  country: string
  pp: string
  countryRank: number
  profilePicture: string
}

interface Target {
  mesh: THREE.Sprite
  player: Player
  velocity: THREE.Vector3
  alive: boolean
  avatarImage?: HTMLImageElement
}

interface Soul {
  mesh: THREE.Sprite
  velocity: THREE.Vector3
  lifetime: number
  opacity: number
}

export class PlayerTargets {
  private players: Player[] = []
  private targets: Target[] = []
  private souls: Soul[] = []
  private avatarCache: Map<string, HTMLImageElement> = new Map()
  private raycaster = new THREE.Raycaster()
  private spawnTimer = 0
  private spawnInterval = 0.3 // seconds between spawns
  private playerIndex = 0

  setPlayers(players: Player[]): void {
    this.players = players
    // Pre-load avatars
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
    this.souls = []
    this.playerIndex = 0
    this.spawnTimer = 0
  }

  update(delta: number): void {
    this.spawnTimer += delta

    // Spawn new targets
    if (this.spawnTimer >= this.spawnInterval && this.playerIndex < this.players.length) {
      this.spawnTarget()
      this.spawnTimer = 0
    }

    // Update existing targets
    for (const target of this.targets) {
      if (!target.alive) continue

      // Move towards camera
      target.mesh.position.add(target.velocity.clone().multiplyScalar(delta))

      // Check if passed camera
      if (target.mesh.position.z > 5) {
        this.removeTarget(target, false) // Don't spawn soul if missed
      }
    }

    // Update souls (floating avatars)
    for (let i = this.souls.length - 1; i >= 0; i--) {
      const soul = this.souls[i]
      soul.lifetime -= delta
      soul.opacity = Math.max(0, soul.lifetime / 2) // Fade over 2 seconds

      // Float upward and drift
      soul.mesh.position.add(soul.velocity.clone().multiplyScalar(delta))
      soul.mesh.scale.multiplyScalar(1 + delta * 0.5) // Grow slightly
      ;(soul.mesh.material as THREE.SpriteMaterial).opacity = soul.opacity

      if (soul.lifetime <= 0) {
        game.scene.scene.remove(soul.mesh)
        ;(soul.mesh.material as THREE.SpriteMaterial).dispose()
        this.souls.splice(i, 1)
      }
    }
  }

  private spawnTarget(): void {
    const player = this.players[this.playerIndex++]
    const avatarImage = this.avatarCache.get(player.profilePicture)

    // Create text sprite with avatar
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = 512
    canvas.height = 128

    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.roundRect(0, 0, canvas.width, canvas.height, 16)
    ctx.fill()

    // Draw avatar circle on left side
    const avatarSize = 80
    const avatarX = 50
    const avatarY = canvas.height / 2

    if (avatarImage) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(avatarImage, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize)
      ctx.restore()

      // Avatar border glow
      ctx.strokeStyle = '#66ffff'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(avatarX, avatarY, avatarSize / 2 + 2, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Draw text (shifted right to make room for avatar)
    const textX = avatarImage ? 280 : canvas.width / 2

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 36px "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Country flag + name
    const flag = this.getFlag(player.country)
    ctx.fillText(`${flag} ${player.name}`, textX, 40)

    // Rank and PP
    ctx.font = '22px "Segoe UI", sans-serif'
    ctx.fillStyle = '#ffcc00'
    ctx.fillText(`#${player.rank} • ${parseFloat(player.pp).toLocaleString()}pp`, textX, 85)

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
    sprite.scale.set(10, 2.5, 1)

    // Random spawn position in tunnel
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * 15 + 5
    sprite.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      -150 - Math.random() * 50
    )

    // Random velocity (mainly towards camera, slight drift)
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      30 + Math.random() * 20
    )

    const target: Target = {
      mesh: sprite,
      player,
      velocity,
      alive: true,
      avatarImage
    }

    this.targets.push(target)
    game.scene.scene.add(sprite)

    // Lazy load avatar for next players
    if (this.playerIndex < this.players.length) {
      this.loadAvatar(this.players[this.playerIndex].profilePicture).catch(() => {})
    }
  }

  private removeTarget(target: Target, spawnSoul: boolean = true): void {
    target.alive = false
    const position = target.mesh.position.clone()
    game.scene.scene.remove(target.mesh)
    ;(target.mesh.material as THREE.SpriteMaterial).dispose()

    // Spawn soul effect (floating avatar) if hit
    if (spawnSoul && target.avatarImage) {
      this.spawnSoul(target.avatarImage, position)
    }
  }

  private spawnSoul(avatarImage: HTMLImageElement, position: THREE.Vector3): void {
    // Create circular avatar sprite
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const size = 128
    canvas.width = size
    canvas.height = size

    // Draw glowing circular avatar
    ctx.save()
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(avatarImage, 0, 0, size, size)
    ctx.restore()

    // Add ethereal glow border
    ctx.strokeStyle = 'rgba(150, 255, 255, 0.8)'
    ctx.lineWidth = 4
    ctx.shadowColor = '#66ffff'
    ctx.shadowBlur = 20
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2)
    ctx.stroke()

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    })

    const sprite = new THREE.Sprite(material)
    sprite.scale.set(3, 3, 1)
    sprite.position.copy(position)

    // Float upward with some random drift
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 5,
      8 + Math.random() * 4, // Float up
      (Math.random() - 0.5) * 5
    )

    const soul: Soul = {
      mesh: sprite,
      velocity,
      lifetime: 2, // 2 seconds
      opacity: 1
    }

    this.souls.push(soul)
    game.scene.scene.add(sprite)
  }

  checkHit(ndc: THREE.Vector2, camera: THREE.Camera): Player | null {
    this.raycaster.setFromCamera(ndc, camera)

    const meshes = this.targets
      .filter(t => t.alive)
      .map(t => t.mesh)

    const intersects = this.raycaster.intersectObjects(meshes)

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object
      const target = this.targets.find(t => t.mesh === hitMesh)

      if (target) {
        this.removeTarget(target, true) // Spawn soul on hit!
        return target.player
      }
    }

    return null
  }

  private getFlag(countryCode: string): string {
    // Convert country code to flag emoji
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  }
}
