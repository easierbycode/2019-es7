import { RESOURCE_PATHS, GAME_DIMENSIONS } from "../constants.js";
import { gameState } from "../gameState.js";
import { globals } from "../globals.js";

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: "BootScene" });
    }

    preload() {
        var cx = GAME_DIMENSIONS.CENTER_X;
        var cy = GAME_DIMENSIONS.CENTER_Y;

        this.loadingBg = null;
        this.loadingG = null;
        this.loadingFrameIndex = 0;

        var self = this;

        function ensureLoadingPreview() {
            if (self.loadingBg || !self.textures.exists("loading_bg") || !self.textures.exists("loading0")) {
                return;
            }

            self.loadingBg = self.add.image(cx, cy, "loading_bg");
            self.loadingBg.setAlpha(0.09);

            self.loadingG = self.add.image(cx, cy, "loading0");

            self.time.addEvent({
                delay: 120,
                loop: true,
                callback: function () {
                    if (!self.loadingG) {
                        return;
                    }

                    self.loadingFrameIndex = (self.loadingFrameIndex + 1) % 3;
                    self.loadingG.setTexture("loading" + String(self.loadingFrameIndex));

                    if (self.loadingBg) {
                        self.loadingBg.flipX = !self.loadingBg.flipX;
                    }
                },
            });
        }

        this.load.on("filecomplete-image-loading_bg", ensureLoadingPreview);
        this.load.on("filecomplete-image-loading0", ensureLoadingPreview);

        this.load.on("complete", function () {
            if (self.loadingG) {
                self.loadingG.destroy();
                self.loadingG = null;
            }
            if (self.loadingBg) {
                self.loadingBg.destroy();
                self.loadingBg = null;
            }
        });

        this.load.atlas("title_ui", "assets/img/title_ui.png", "assets/title_ui.json");
        this.load.atlas("game_ui", "assets/img/game_ui.png", "assets/game_ui.json");
        this.load.atlas("game_asset", "assets/img/game_asset.png", "assets/game_asset.json");

        this.load.json("recipe", "assets/game.json");

        this.load.image("title_bg", "assets/img/title_bg.jpg");
        for (var i = 0; i < 5; i++) {
            this.load.image("stage_loop" + i, "assets/img/stage/stage_loop" + i + ".png");
            this.load.image("stage_end" + i, "assets/img/stage/stage_end" + i + ".png");
        }

        this.load.image("loading_bg", "assets/img/loading/loading_bg.png");
        this.load.image("loading0", "assets/img/loading/loading0.gif");
        this.load.image("loading1", "assets/img/loading/loading1.gif");
        this.load.image("loading2", "assets/img/loading/loading2.gif");

        if (!gameState.lowModeFlg) {
            var soundKeys = Object.keys(RESOURCE_PATHS);
            for (var s = 0; s < soundKeys.length; s++) {
                var key = soundKeys[s];
                var path = RESOURCE_PATHS[key];
                if (path.indexOf(".mp3") > 0) {
                    this.load.audio(key, path);
                }
            }
        }
    }

    create() {
        var recipe = this.cache.json.get("recipe");
        if (recipe) {
            gameState._phaserRecipe = recipe;
        }

        this.scene.start("PhaserTitleScene");
    }
}

export default BootScene;
