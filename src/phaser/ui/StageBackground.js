import { GAME_DIMENSIONS } from "../../constants.js";
import { gameState } from "../../gameState.js";

var GW = GAME_DIMENSIONS.WIDTH;
var GH = GAME_DIMENSIONS.HEIGHT;

export class PhaserStageBackground {
    constructor(scene, stageId) {
        this.scene = scene;

        var bgPrefix = gameState.hasCustomEnemies ? "stage_loop_c" : "stage_loop";
        var bgEndPrefix = gameState.hasCustomEnemies ? "stage_end_c" : "stage_end";
        this.stageBg = scene.add.tileSprite(0, 0, GW, GH, bgPrefix + stageId);
        this.stageBg.setOrigin(0, 0);

        this.stageEndBg = scene.add.image(0, 0, bgEndPrefix + stageId);
        this.stageEndBg.setOrigin(0, 0);
        this.stageEndBg.y = -this.stageEndBg.height;
        this.stageEndBg.setVisible(false);

        this.coverOverlay = null;
        if (scene.textures.getFrame("game_asset", "stagebgOver.gif")) {
            this.coverOverlay = scene.add.tileSprite(0, 0, GW, GH, "game_asset", "stagebgOver.gif");
            this.coverOverlay.setOrigin(0, 0);
            this.coverOverlay.setDepth(99);
        }
    }

    scroll(amount) {
        this.stageBg.tilePositionY -= amount;
    }

    showEndBg() {
        this.stageEndBg.setVisible(true);
        this.bossAppearFlg = true;
        this.bossAppearScroll = 0;
    }

    updateBossScroll(scrollAmount) {
        if (!this.bossAppearFlg) return;
        this.stageBg.y += scrollAmount;
        this.stageEndBg.y += scrollAmount;
        this.bossAppearScroll = (this.bossAppearScroll || 0) + scrollAmount;
        if (this.bossAppearScroll >= 214 || this.stageEndBg.y >= 42) {
            this.bossAppearFlg = false;
        }
    }
}
