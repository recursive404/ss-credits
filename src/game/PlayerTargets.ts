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
}

interface Target {
  mesh: THREE.Sprite
  player: Player
  velocity: THREE.Vector3
  alive: boolean
}

export class PlayerTargets {
  private players: Player[] = []
  private targets: Target[] = []
  private raycaster = new THREE.Raycaster()
  private spawnTimer = 0
  private spawnInterval = 0.3 // seconds between spawns
  private playerIndex = 0

  setPlayers(players: Player[]): void {
    this.players = players
  }

  start(): void {
    this.targets = []
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
        this.removeTarget(target)
      }
    }
  }

  private spawnTarget(): void {
    const player = this.players[this.playerIndex++]

    // Create text sprite
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = 512
    canvas.height = 128

    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.roundRect(0, 0, canvas.width, canvas.height, 16)
    ctx.fill()

    // Draw text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 48px "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Country flag + name
    const flag = this.getFlag(player.country)
    ctx.fillText(`${flag} ${player.name}`, canvas.width / 2, 45)

    // Rank and PP
    ctx.font = '24px "Segoe UI", sans-serif'
    ctx.fillStyle = '#ffcc00'
    ctx.fillText(`#${player.rank} • ${parseFloat(player.pp).toLocaleString()}pp`, canvas.width / 2, 95)

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
    sprite.scale.set(8, 2, 1)

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
      alive: true
    }

    this.targets.push(target)
    game.scene.scene.add(sprite)
  }

  private removeTarget(target: Target): void {
    target.alive = false
    game.scene.scene.remove(target.mesh)
    ;(target.mesh.material as THREE.SpriteMaterial).dispose()
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
        this.removeTarget(target)
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
