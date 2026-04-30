import { GAME_DIMENSIONS } from "../constants.js";
import { forgeLevel, isAvailable as forgeIsAvailable } from "../forge/forge-driver.js";

export class PhaserForgeScene extends Phaser.Scene {
    constructor() {
        super({ key: "PhaserForgeScene" });
    }

    init(data) {
        this.initialLevelName = (data && data.levelName) || "";
        this.busy = false;
        this.lastResult = null;
    }

    create() {
        const W = GAME_DIMENSIONS.WIDTH;
        const H = GAME_DIMENSIONS.HEIGHT;

        this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0, 0);

        this.add.text(W / 2, 24, "BUILD APK", {
            fontFamily: "Arial",
            fontSize: "20px",
            fontStyle: "bold",
            color: "#0f0",
            stroke: "#000",
            strokeThickness: 3
        }).setOrigin(0.5, 0);

        this.add.text(W / 2, 56, "Enter Firebase level name:", {
            fontFamily: "Arial",
            fontSize: "10px",
            color: "#fff"
        }).setOrigin(0.5, 0);

        this.levelText = this.add.text(W / 2, 80, this.initialLevelName || "(tap to type)", {
            fontFamily: "Arial",
            fontSize: "14px",
            color: "#9be37f",
            stroke: "#000",
            strokeThickness: 2,
            backgroundColor: "#111",
            padding: { left: 8, right: 8, top: 4, bottom: 4 }
        }).setOrigin(0.5, 0);
        this.levelText.setInteractive({ useHandCursor: true });
        const self = this;
        this.levelText.on("pointerup", function () { self.promptForLevelName(); });

        this.statusText = this.add.text(W / 2, 130, "", {
            fontFamily: "Arial",
            fontSize: "10px",
            color: "#fff",
            wordWrap: { width: W - 24 },
            align: "center"
        }).setOrigin(0.5, 0);

        this.progressBg = this.add.rectangle(W / 2, 200, W - 32, 12, 0x222222).setOrigin(0.5);
        this.progressBg.setStrokeStyle(1, 0x666666);
        this.progressBar = this.add.rectangle(16, 194, 0, 12, 0x0f0).setOrigin(0, 0);

        this.buildBtn = this.makeButton(W / 2, H - 200, "BUILD", 0x0a0, function () {
            self.startBuild();
        });

        this.installBtn = this.makeButton(W / 2, H - 150, "INSTALL", 0x06c, function () {
            self.installLast();
        });
        this.installBtn.setVisible(false);

        this.backBtn = this.makeButton(W / 2, H - 60, "BACK", 0x444, function () {
            if (!self.busy) self.scene.start("PhaserTitleScene");
        });

        if (!forgeIsAvailable()) {
            this.statusText.setText("APK Forge requires the Cordova Android build.\nThis feature is unavailable in the browser.");
            this.buildBtn.setAlpha(0.3);
            this.buildBtn.removeInteractive();
        } else {
            this.statusText.setText("Ready.");
        }
    }

    makeButton(x, y, label, fill, onUp) {
        const w = 140;
        const h = 36;
        const g = this.add.rectangle(x, y, w, h, fill).setStrokeStyle(2, 0xffffff);
        const t = this.add.text(x, y, label, {
            fontFamily: "Arial",
            fontSize: "14px",
            fontStyle: "bold",
            color: "#fff"
        }).setOrigin(0.5);
        g.setInteractive({ useHandCursor: true });
        g.on("pointerup", onUp);
        g.on("pointerover", function () { g.setFillStyle(fill, 0.85); });
        g.on("pointerout",  function () { g.setFillStyle(fill, 1); });
        g.label = t;
        return g;
    }

    promptForLevelName() {
        const cur = this.levelText.text === "(tap to type)" ? "" : this.levelText.text;
        const v = window.prompt("Firebase level name:", cur);
        if (v === null) return;
        const trimmed = String(v).trim();
        if (!trimmed) return;
        this.levelText.setText(trimmed);
    }

    setProgress(percent) {
        const max = (GAME_DIMENSIONS.WIDTH - 32);
        const w = Math.max(0, Math.min(100, percent || 0)) / 100 * max;
        this.progressBar.width = w;
    }

    startBuild() {
        if (this.busy || !forgeIsAvailable()) return;
        const name = this.levelText.text;
        if (!name || name === "(tap to type)") {
            this.statusText.setText("Enter a level name first.");
            return;
        }

        this.busy = true;
        this.installBtn.setVisible(false);
        this.lastResult = null;
        this.setProgress(0);

        const self = this;
        const ensurePerm = function () {
            return new Promise(function (resolve) {
                if (!window.ApkForge) return resolve(false);
                window.ApkForge.checkInstallPermission(function (allowed) {
                    if (allowed) return resolve(true);
                    self.statusText.setText("Allow installs from this app, then tap BUILD again.");
                    window.ApkForge.requestInstallPermission(function () {}, function () {});
                    resolve(false);
                }, function () { resolve(false); });
            });
        };

        ensurePerm().then(function (ok) {
            if (!ok) { self.busy = false; return; }
            return forgeLevel({
                levelName: name,
                onProgress: function (ev) {
                    if (typeof ev.percent === "number") self.setProgress(ev.percent);
                    if (ev.message) self.statusText.setText(ev.message);
                }
            }).then(function (res) {
                self.busy = false;
                self.lastResult = res;
                self.setProgress(100);
                const sizeMb = (res.size / (1024 * 1024)).toFixed(1);
                self.statusText.setText("Built " + name + ".apk (" + sizeMb + " MB)\nReady to install.");
                self.installBtn.setVisible(true);
            }).catch(function (err) {
                self.busy = false;
                self.statusText.setText("FAILED: " + (err && err.message || err));
            });
        });
    }

    installLast() {
        if (!this.lastResult || !window.ApkForge) return;
        const uri = this.lastResult.uri;
        if (!uri) {
            this.statusText.setText("No content URI returned; open Files app to install.");
            return;
        }
        window.ApkForge.install({ uri: uri }, function () {}, function (e) {
            console.error("install error", e);
        });
    }
}

export default PhaserForgeScene;
