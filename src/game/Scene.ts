/**
 * Scene.ts - Three.js scene setup
 * Manages renderer, camera, and scene graph
 */

import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

export class Scene {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public renderer: THREE.WebGLRenderer
  private composer: EffectComposer

  constructor() {
    // Create scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0a1a)
    this.scene.fog = new THREE.Fog(0x0a0a1a, 50, 200)

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.camera.position.set(0, 0, 0)

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    document.getElementById('app')!.appendChild(this.renderer.domElement)

    // Post-processing
    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))

    // Bloom for neon glow - tuned to avoid blowing out sprites
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.4,  // strength (reduced from 0.8)
      0.3,  // radius (reduced)
      0.92  // threshold (raised - less bloom on mid-tones)
    )
    this.composer.addPass(bloomPass)

    // Create tunnel/environment
    this.createEnvironment()

    // Handle resize
    window.addEventListener('resize', this.onResize.bind(this))

    // Start render loop
    this.animate()
  }

  private createEnvironment(): void {
    // Neon grid tunnel - cylindrical tube
    const tunnelGeometry = new THREE.CylinderGeometry(30, 30, 500, 32, 50, true)
    const tunnelMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(0xff3366) }, // Red
        color2: { value: new THREE.Color(0x3366ff) }, // Blue
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
          // Grid pattern
          float gridX = step(0.95, fract(vUv.x * 32.0));
          float gridY = step(0.95, fract(vUv.y * 100.0 + time * 0.5));
          float grid = max(gridX, gridY);

          // Color gradient based on position
          vec3 color = mix(color1, color2, sin(vUv.y * 3.14159 + time) * 0.5 + 0.5);

          // Fade at edges
          float alpha = grid * 0.6;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false
    })

    const tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial)
    tunnel.rotation.x = Math.PI / 2
    tunnel.position.z = -200
    this.scene.add(tunnel)

    // Store reference to update time uniform
    ;(this as any).tunnelMaterial = tunnelMaterial

    // Add some floating particles
    this.createParticles()
  }

  private createParticles(): void {
    const particleCount = 1000
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 25 + 5
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = Math.sin(angle) * radius
      positions[i * 3 + 2] = Math.random() * -400
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      color: 0x66ffff,
      size: 0.5,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    })

    const particles = new THREE.Points(geometry, material)
    this.scene.add(particles)
    ;(this as any).particles = particles
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.composer.setSize(window.innerWidth, window.innerHeight)
  }

  private time = 0

  private animate = (): void => {
    requestAnimationFrame(this.animate)

    this.time += 0.016

    // Update tunnel shader
    if ((this as any).tunnelMaterial) {
      (this as any).tunnelMaterial.uniforms.time.value = this.time
    }

    // Animate particles
    if ((this as any).particles) {
      const positions = (this as any).particles.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 2] += 0.5 // Move towards camera
        if (positions[i + 2] > 10) {
          positions[i + 2] = -400 // Reset
        }
      }
      (this as any).particles.geometry.attributes.position.needsUpdate = true
    }

    this.composer.render()
  }
}
