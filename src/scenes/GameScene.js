import { GameScene as GameSceneCore } from "../app-original.js";
import { globals } from "../globals.js";
import { HUD } from "../ui/HUD.js";
import { GameTitle } from "../ui/GameTitle.js";
import { StageBackground } from "../ui/StageBackground.js";
import { CutinContainer } from "../ui/CutinContainer.js";

function safeDestroy(node) {
    if (!node) {
        return;
    }

    if (node.parent) {
        node.parent.removeChild(node);
    }

    if (typeof node.removeAllListeners === "function") {
        node.removeAllListeners();
    }

    if (!node.destroyed && typeof node.destroy === "function") {
        try {
            node.destroy({ children: true });
        } catch (error) {
            // Ignore teardown issues from legacy objects.
        }
    }
}

function replaceSceneNode(scene, oldNode, nextNode) {
    let index = -1;

    if (oldNode && oldNode.parent === scene) {
        index = scene.getChildIndex(oldNode);
        scene.removeChildAt(index);
    }

    if (index >= 0) {
        scene.addChildAt(nextNode, Math.min(index, scene.children.length));
    } else {
        scene.addChild(nextNode);
    }

    safeDestroy(oldNode);
}

function resolveStageTextureList(currentStageBg) {
    if (currentStageBg && Array.isArray(currentStageBg.allStagebgTexturesList)) {
        return currentStageBg.allStagebgTexturesList;
    }

    const resources = globals.resources || {};
    const textureList = [];

    for (let i = 0; i < 5; i += 1) {
        const endResource = resources["stage_end" + String(i)];
        const loopResource = resources["stage_loop" + String(i)];
        const endTexture = endResource && endResource.texture ? endResource.texture : PIXI.Texture.WHITE;
        const loopTexture = loopResource && loopResource.texture ? loopResource.texture : PIXI.Texture.WHITE;
        textureList.push([endTexture, loopTexture]);
    }

    return textureList;
}

function wireExtractedUi(scene) {
    if (!scene || scene.__es7ExtractedUiWired) {
        return;
    }

    scene.__es7ExtractedUiWired = true;

    const oldStageBg = scene.stageBg;
    const oldHud = scene.hud;
    const oldTitle = scene.title;
    const oldCutinCont = scene.cutinCont;

    const stageBg = new StageBackground(resolveStageTextureList(oldStageBg));
    const hud = new HUD();
    hud.on(HUD.CUSTOM_EVENT_SP_FIRE, scene.spFire.bind(scene));

    const title = new GameTitle();
    title.on(GameTitle.EVENT_START, scene.gameStart.bind(scene));

    const cutinCont = new CutinContainer();

    scene.stageBg = stageBg;
    scene.hud = hud;
    scene.title = title;
    scene.cutinCont = cutinCont;

    replaceSceneNode(scene, oldStageBg, stageBg);
    replaceSceneNode(scene, oldHud, hud);
    replaceSceneNode(scene, oldTitle, title);
    safeDestroy(oldCutinCont);
}

if (!GameSceneCore.prototype.__es7ExtractedUiPatchApplied) {
    const originalRun = GameSceneCore.prototype.run;

    GameSceneCore.prototype.__es7ExtractedUiPatchApplied = true;
    GameSceneCore.prototype.run = function patchedRun(...args) {
        wireExtractedUi(this);
        return originalRun.apply(this, args);
    };
}

export class GameScene extends GameSceneCore {}

export default GameScene;
