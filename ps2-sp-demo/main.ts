// Browser demo: boots Phaser 4, preloads the game's atlases and JSON,
// builds the 5velte-ps2 runtime over the Phaser host, and runs the ps2-sp
// game. URL params: ?scene=game|adventure|continue|ending skips the title,
// ?level=2028 swaps the Firebase level (default foo).
//
// The library is consumed straight from the JSR module
// @easierbycode/svelte-ps2 (see package.json / .npmrc), not a local checkout.

import Phaser from 'phaser'
import { createRuntime, type PS2Runtime } from '@easierbycode/svelte-ps2/core'
import { createPhaserHost, registerCanvasBitmapFont } from '@easierbycode/svelte-ps2/phaser'
import { createGame, type GameOptions } from '@easierbycode/svelte-ps2/ps2-sp'
import { createKeyboardPads } from './pads.ts'

const TEXTURES: Record<string, string> = {
  'assets/game_ui.png': 'game_ui',
  'assets/game_asset.png': 'game_asset',
  'assets/cyber_liberty.png': 'cyber_liberty',
  'assets/level_foo_atlas.png': 'level_atlas',
  'assets/level_2028_atlas.png': 'level_atlas_2028',
}

const TEXT_FILES = [
  'assets/game.json',
  'assets/game_ui.json',
  'assets/game_asset.json',
  'assets/level_foo.json',
  'assets/level_foo_atlas.json',
  'assets/level_2028.json',
  'assets/level_2028_atlas.json',
]

class DemoScene extends Phaser.Scene {
  rt: PS2Runtime | null = null

  preload() {
    for (const [path, key] of Object.entries(TEXTURES)) this.load.image(key, path)
    for (const path of TEXT_FILES) this.load.text(path, path)
  }

  create() {
    registerCanvasBitmapFont(this, 'ps2font', { fontSize: 12 })

    const { host } = createPhaserHost({
      scene: this,
      pads: createKeyboardPads(this),
      resolveTexture: (path) => TEXTURES[path] ?? path,
      resolveFont: () => ({ key: 'ps2font', scale: 1 }),
      storage: {
        loadFile: (path) => {
          if (this.cache.text.exists(path)) return this.cache.text.get(path) as string
          try {
            return localStorage.getItem(`5velte-ps2:${path}`)
          } catch {
            return null
          }
        },
        writeFile: (path, data) => {
          try {
            localStorage.setItem(`5velte-ps2:${path}`, data)
          } catch {
            // storage unavailable (private mode) — high score just won't persist
          }
        },
      },
    })

    const rt = createRuntime(host)
    const params = new URLSearchParams(location.search)
    const options: GameOptions = {}
    const startScene = params.get('scene')
    if (startScene) options.startScene = startScene
    if (params.get('level') === '2028') {
      options.level = {
        dataPath: 'assets/level_2028.json',
        atlasPngPath: 'assets/level_2028_atlas.png',
        atlasJsonPath: 'assets/level_2028_atlas.json',
      }
    }

    const game = createGame(rt, options)
    this.rt = rt
    ;(window as unknown as Record<string, unknown>).ps2 = { rt, game }
  }

  update() {
    this.rt?.tick()
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: 640,
  height: 448,
  parent: 'app',
  backgroundColor: '#000000',
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: DemoScene,
})
