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

        var progressBg = this.add.graphics();
        progressBg.fillStyle(0x222222, 1);
        progressBg.fillRect(cx - 80, cy - 6, 160, 12);

        var progressBar = this.add.graphics();

        var loadingText = this.add.text(cx, cy - 24, "LOADING...", {
            fontFamily: "sans-serif",
            fontSize: "12px",
            color: "#ffffff",
        });
        loadingText.setOrigin(0.5);

        this.load.on("progress", function (value) {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(cx - 78, cy - 4, 156 * value, 8);
        });

        this.load.on("complete", function () {
            progressBar.destroy();
            progressBg.destroy();
            loadingText.destroy();
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
