import { gameState } from "../gameState.js";
import { globals } from "../globals.js";

function resolveTicker() {
    if (globals.pixiApp && globals.pixiApp.ticker) {
        return globals.pixiApp.ticker;
    }

    const game = globalThis.__PHASER_GAME__;
    if (game && game.ticker) {
        return game.ticker;
    }

    return PIXI.ticker && PIXI.ticker.shared ? PIXI.ticker.shared : null;
}

function dlog() {}

export class BaseScene extends PIXI.Container {
    constructor(id) {
        super();

        this.id = id;
        this.ticker = resolveTicker();
        this._accumulator = 0;
        this._loop = this._onTick.bind(this);

        this._onSceneAdded = this._handleSceneAdded.bind(this);
        this._onSceneRemoved = this._handleSceneRemoved.bind(this);

        this.on("added", this._onSceneAdded);
        this.on("removed", this._onSceneRemoved);
    }

    _onTick(delta) {
        // Keep PIXI's native delta implementation and scale to 120Hz logic.
        // PIXI delta is normalized to 60fps, so multiply by 2.
        this._accumulator += Math.min((delta || 0) * 2, 8);
        while (this._accumulator >= 1) {
            this._accumulator -= 1;
            this.loop(1);
        }
    }

    _handleSceneAdded(parent) {
        this.sceneAdded(parent);
    }

    _handleSceneRemoved(parent) {
        this.sceneRemoved(parent);
    }

    sceneAdded() {
        dlog(this.constructor.name + ".sceneAdded() Start.");
        this.run();

        if (!this.ticker) {
            this.ticker = resolveTicker();
        }

        if (this.ticker) {
            this.ticker.add(this._loop);
            if (typeof this.ticker.start === "function") {
                this.ticker.start();
            }
        }

        dlog(this.constructor.name + ".sceneAdded() End.");
    }

    sceneRemoved() {
        if (this.ticker) {
            this.ticker.remove(this._loop);
            // NOTE: Do NOT call ticker.stop() here.  The ticker is shared by
            // the PIXI.Application (it drives rendering and all other
            // listeners).  Stopping it kills the next scene's _onTick
            // callback even after ticker.start() is called in sceneAdded.
        }

        while (this.children[0]) {
            const child = this.children[0];
            if (child && typeof child.loop === "function" && this.ticker) {
                this.ticker.remove(child.loop, child);
            }
            this.removeChild(child);
        }
    }

    run() {}

    loop(delta) {
        const frame = Number(gameState.frame || 0);
        gameState.frame = (frame + 1) % 60;

        for (let i = 0; i < this.children.length; i += 1) {
            const child = this.children[i];
            if (child && typeof child.loop === "function") {
                child.loop(delta);
            }
        }
    }

    addScene(sceneId, sceneClass) {
        this.switchScene(sceneId, sceneClass);
    }

    switchScene(sceneId, sceneClass) {
        if (globals.gameManager && typeof globals.gameManager.switchToScene === "function") {
            globals.gameManager.switchToScene(sceneClass, sceneId);
            return;
        }

        const game = globalThis.__PHASER_GAME__;
        if (!game || !game.stage || typeof sceneClass !== "function") {
            return;
        }

        if (game.stage.children.indexOf(this) !== -1) {
            game.stage.removeChild(this);
        }

        game.stage.addChild(new sceneClass(sceneId));
    }

    nextScene() {
        const game = globalThis.__PHASER_GAME__;
        if (game && game.stage && game.stage.children.indexOf(this) !== -1) {
            game.stage.removeChild(this);
        }
    }

    destroy(options) {
        this.off("added", this._onSceneAdded);
        this.off("removed", this._onSceneRemoved);

        if (this.ticker) {
            this.ticker.remove(this._loop);
        }

        super.destroy(options);
    }
}

export default BaseScene;
