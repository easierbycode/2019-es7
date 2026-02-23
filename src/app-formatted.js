import { instantiateGame as instantiateLegacyGame, LoadScene as LegacyLoadScene } from "./app-original.js";
import { LoadScene as ExtractedLoadScene } from "./scenes/LoadScene.js";

export { BaseCast } from "./game-objects/BaseCast.js";
export { BaseSpriteCast } from "./game-objects/BaseSpriteCast.js";
export { BaseUnit } from "./game-objects/BaseUnit.js";
export { Bullet } from "./game-objects/Bullet.js";
export { Player } from "./game-objects/Player.js";
export { Enemy } from "./game-objects/Enemy.js";
export { Boss } from "./game-objects/Boss.js";
export { BossBison } from "./game-objects/BossBison.js";
export { BossBarlog } from "./game-objects/BossBarlog.js";
export { BossSagat } from "./game-objects/BossSagat.js";
export { BossVega } from "./game-objects/BossVega.js";
export { BossGoki } from "./game-objects/BossGoki.js";
export { BossFang } from "./game-objects/BossFang.js";

export { BaseScene } from "./scenes/BaseScene.js";
export { ContinueScene } from "./scenes/ContinueScene.js";
export { GameScene } from "./scenes/GameScene.js";
export { ResultScene } from "./scenes/ResultScene.js";
export { GameoverScene } from "./scenes/GameoverScene.js";
export { CongraScene } from "./scenes/CongraScene.js";
export { EndingScene } from "./scenes/EndingScene.js";
export { AdvScene } from "./scenes/AdvScene.js";
export { TitleScene } from "./scenes/TitleScene.js";
export { LoadScene } from "./scenes/LoadScene.js";
export { gameState, loadHighScore, saveHighScore } from "./gameState.js";
export { globals } from "./globals.js";
export { HitTester } from "./HitTester.js";
export {
    play,
    bgmPlay,
    stop,
    stopAll,
    pauseAll,
    resumeAll,
    setInitialVolumes,
} from "./soundManager.js";

function patchLegacyBootScene() {
    if (LegacyLoadScene.prototype.__es7BootPatchApplied) {
        return;
    }

    LegacyLoadScene.prototype.__es7BootPatchApplied = true;

    const originalSceneAdded = LegacyLoadScene.prototype.sceneAdded;
    const originalSceneRemoved = LegacyLoadScene.prototype.sceneRemoved;

    LegacyLoadScene.prototype.sceneAdded = function patchedLegacyBootSceneAdded(...args) {
        if (this.__es7BootForwarded) {
            return;
        }

        const stage = this.parent;
        if (!stage) {
            return originalSceneAdded.apply(this, args);
        }

        this.__es7BootForwarded = true;
        this.__es7SkipLegacySceneRemoved = true;

        if (stage.children.indexOf(this) !== -1) {
            stage.removeChild(this);
        }

        stage.addChild(new ExtractedLoadScene());
    };

    LegacyLoadScene.prototype.sceneRemoved = function patchedLegacyBootSceneRemoved(...args) {
        if (this.__es7SkipLegacySceneRemoved) {
            this.__es7SkipLegacySceneRemoved = false;
            return;
        }

        return originalSceneRemoved.apply(this, args);
    };
}

export function instantiateGame() {
    patchLegacyBootScene();

    const game = instantiateLegacyGame();
    if (game) {
        globalThis.__PHASER_GAME__ = game;
    }
    return game;
}

export default instantiateGame;
