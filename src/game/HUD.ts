/**
 * HUD.ts - Heads-up display
 * Score, crosshair, messages
 */

export class HUD {
  private container: HTMLDivElement
  private scoreEl: HTMLDivElement
  private streakEl: HTMLDivElement
  private crosshair: HTMLDivElement
  private messageEl: HTMLDivElement
  private hitFeedback: HTMLDivElement

  constructor() {
    this.container = document.createElement('div')
    this.container.id = 'hud'
    this.container.innerHTML = `
      <style>
        #hud {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          font-family: 'Segoe UI', system-ui, sans-serif;
          z-index: 100;
        }
        #hud-score {
          position: absolute;
          top: 20px;
          left: 20px;
          color: #fff;
          font-size: 32px;
          font-weight: bold;
          text-shadow: 0 0 10px rgba(255,255,255,0.5);
        }
        #hud-streak {
          position: absolute;
          top: 60px;
          left: 20px;
          color: #ffcc00;
          font-size: 20px;
          font-weight: bold;
          text-shadow: 0 0 10px rgba(255,200,0,0.5);
          opacity: 0;
          transition: opacity 0.2s;
        }
        #hud-streak.active {
          opacity: 1;
        }
        #hud-crosshair {
          position: absolute;
          width: 40px;
          height: 40px;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        #hud-crosshair::before,
        #hud-crosshair::after {
          content: '';
          position: absolute;
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 0 10px rgba(255, 100, 100, 0.8);
        }
        #hud-crosshair::before {
          width: 2px;
          height: 100%;
          left: 50%;
          transform: translateX(-50%);
        }
        #hud-crosshair::after {
          width: 100%;
          height: 2px;
          top: 50%;
          transform: translateY(-50%);
        }
        #hud-message {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #fff;
          font-size: 48px;
          font-weight: bold;
          text-shadow: 0 0 20px rgba(255,255,255,0.8);
          opacity: 0;
          transition: opacity 0.3s;
        }
        #hud-message.visible {
          opacity: 1;
        }
        #hud-hit {
          position: absolute;
          color: #00ff00;
          font-size: 24px;
          font-weight: bold;
          text-shadow: 0 0 10px rgba(0,255,0,0.8);
          pointer-events: none;
          opacity: 0;
          transform: translate(-50%, -50%);
          transition: all 0.5s ease-out;
        }
        #hud-hit.show {
          opacity: 1;
          transform: translate(-50%, -100%);
        }
        .title {
          position: absolute;
          top: 20px;
          right: 20px;
          color: rgba(255,255,255,0.5);
          font-size: 14px;
        }
      </style>
      <div id="hud-score">0</div>
      <div id="hud-streak"></div>
      <div id="hud-crosshair"></div>
      <div id="hud-message"></div>
      <div id="hud-hit"></div>
      <div class="title">SS-CREDITS // ScoreSaber Shooter</div>
    `
    document.body.appendChild(this.container)

    this.scoreEl = this.container.querySelector('#hud-score')!
    this.streakEl = this.container.querySelector('#hud-streak')!
    this.crosshair = this.container.querySelector('#hud-crosshair')!
    this.messageEl = this.container.querySelector('#hud-message')!
    this.hitFeedback = this.container.querySelector('#hud-hit')!
  }

  updateScore(score: number, streak: number): void {
    this.scoreEl.textContent = score.toString()

    if (streak >= 3) {
      this.streakEl.textContent = `${streak}x STREAK!`
      this.streakEl.classList.add('active')
    } else {
      this.streakEl.classList.remove('active')
    }
  }

  updateCrosshair(x: number, y: number): void {
    this.crosshair.style.left = `${x}px`
    this.crosshair.style.top = `${y}px`
  }

  showMessage(text: string, duration: number): void {
    this.messageEl.textContent = text
    this.messageEl.classList.add('visible')

    if (duration > 0) {
      setTimeout(() => this.hideMessage(), duration)
    }
  }

  hideMessage(): void {
    this.messageEl.classList.remove('visible')
  }

  showHit(name: string, points: number, x: number, y: number): void {
    this.hitFeedback.textContent = `+${points} ${name}`
    this.hitFeedback.style.left = `${x}px`
    this.hitFeedback.style.top = `${y}px`
    this.hitFeedback.classList.remove('show')

    // Trigger reflow for animation restart
    void this.hitFeedback.offsetWidth
    this.hitFeedback.classList.add('show')

    setTimeout(() => {
      this.hitFeedback.classList.remove('show')
    }, 500)
  }
}
