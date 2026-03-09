import { GAME_DIMENSIONS } from "../../constants.js";

var GW = GAME_DIMENSIONS.WIDTH;
var GH = GAME_DIMENSIONS.HEIGHT;

export class PhaserStageBackground {
    constructor(scene, stageId) {
        this.scene = scene;

        this.stageBg = scene.add.tileSprite(0, 0, GW, GH, "stage_loop" + stageId);
        this.stageBg.setOrigin(0, 0);

        this.stageEndBg = scene.add.image(0, -GH, "stage_end" + stageId);
        this.stageEndBg.setOrigin(0, 0);
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
        this.scene.tweens.add({
            targets: this.stageEndBg,
            y: 0,
            duration: 3000,
        });
    }
}
