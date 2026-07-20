// Keyboard-backed PadSource for the demo. The game polls input at a fixed
// 30 Hz, so a key tapped and released between two polls could be missed.
// To keep the demo comfortably playable, each key-down is latched as "held"
// for a short minimum window (~66 ms, two steps), guaranteeing every tap is
// visible to at least one poll. The game does its own step-accurate edge
// detection on top of held(), so fresh() simply mirrors held().
//
// Arrows = d-pad, Z = CROSS, X = CIRCLE, C = TRIANGLE, V = SQUARE,
// Enter = START, Shift = SELECT, Q/E = L1/R1.

import Phaser from 'phaser'
import { PAD_BUTTONS } from '@easierbycode/svelte-ps2/core'
import type { PadSource } from '@easierbycode/svelte-ps2/phaser'

const MIN_HOLD_MS = 66

export function createKeyboardPads(scene: Phaser.Scene): PadSource {
  const kb = scene.input.keyboard
  if (!kb) throw new Error('demo: keyboard plugin unavailable')

  interface Binding {
    mask: number
    key: Phaser.Input.Keyboard.Key
    latchUntil: number
  }

  const bind = (mask: number, keyCode: string): Binding => {
    const key = kb.addKey(keyCode, false)
    const binding: Binding = { mask, key, latchUntil: 0 }
    key.on('down', () => {
      binding.latchUntil = scene.time.now + MIN_HOLD_MS
    })
    return binding
  }

  const bindings: Binding[] = [
    bind(PAD_BUTTONS.UP, 'UP'),
    bind(PAD_BUTTONS.DOWN, 'DOWN'),
    bind(PAD_BUTTONS.LEFT, 'LEFT'),
    bind(PAD_BUTTONS.RIGHT, 'RIGHT'),
    bind(PAD_BUTTONS.CROSS, 'Z'),
    bind(PAD_BUTTONS.CIRCLE, 'X'),
    bind(PAD_BUTTONS.TRIANGLE, 'C'),
    bind(PAD_BUTTONS.SQUARE, 'V'),
    bind(PAD_BUTTONS.START, 'ENTER'),
    bind(PAD_BUTTONS.SELECT, 'SHIFT'),
    bind(PAD_BUTTONS.L1, 'Q'),
    bind(PAD_BUTTONS.R1, 'E'),
  ]

  const held = (mask: number): boolean => {
    const now = scene.time.now
    return bindings.some(
      (b) => (mask & b.mask) !== 0 && (b.key.isDown || now < b.latchUntil),
    )
  }

  return { held, fresh: held }
}
