/**
 * SS-Credits - SSBM Credits-style ScoreSaber Shooter
 * Shoot player names as they fly through a neon tunnel!
 */

import './style.css'
import { game } from './game/Game'

// Hide default cursor on game canvas
document.body.style.cursor = 'none'

// Initialize game
game.init().catch(console.error)
