import { ContinueScene as ContinueSceneCore } from "../app-original.js";
import { ContinueYesButton } from "../ui/ContinueYesButton.js";
import { ContinueNoButton } from "../ui/ContinueNoButton.js";
import { GotoTitleButton } from "../ui/GotoTitleButton.js";
import { TwitterButton } from "../ui/TwitterButton.js";
import { BigNumberDisplay } from "../ui/BigNumberDisplay.js";

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
            // Ignore teardown errors from legacy display objects.
        }
    }
}

function copyDisplayState(source, target) {
    if (!source || !target) {
        return;
    }

    target.x = source.x;
    target.y = source.y;
    target.alpha = source.alpha;
    target.visible = source.visible;
    target.rotation = source.rotation;
    target.scale.x = source.scale.x;
    target.scale.y = source.scale.y;
    target.interactive = source.interactive;
    target.buttonMode = source.buttonMode;
}

function replaceDisplayObject(scene, oldNode, nextNode) {
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

function replaceContinueChoiceButtons(scene) {
    if (!scene || scene.__es7ContinueChoiceButtonsReplaced) {
        return;
    }

    scene.__es7ContinueChoiceButtonsReplaced = true;

    const oldYes = scene.yesText;
    const oldNo = scene.noText;
    const yesText = new ContinueYesButton();
    const noText = new ContinueNoButton();

    copyDisplayState(oldYes, yesText);
    copyDisplayState(oldNo, noText);

    if (!scene._onContinueYesPointerUp) {
        scene._onContinueYesPointerUp = scene.selectYes.bind(scene);
    }
    if (!scene._onContinueNoPointerUp) {
        scene._onContinueNoPointerUp = scene.selectNo.bind(scene);
    }

    yesText.on("pointerup", scene._onContinueYesPointerUp);
    noText.on("pointerup", scene._onContinueNoPointerUp);

    scene.yesText = yesText;
    scene.noText = noText;

    replaceDisplayObject(scene, oldYes, yesText);
    replaceDisplayObject(scene, oldNo, noText);

    if (yesText.alpha < 1 || noText.alpha < 1) {
        TweenMax.to([yesText, noText], 0.8, {
            alpha: 1,
        });
    }
}

function mirrorBigNumberTextures(fromBigNumber, toBigNumber) {
    if (!fromBigNumber || !toBigNumber) {
        return;
    }

    const oldSprites = Array.isArray(fromBigNumber.numSpList) ? fromBigNumber.numSpList : [];
    const nextSprites = Array.isArray(toBigNumber.numSpList) ? toBigNumber.numSpList : [];
    const length = Math.min(oldSprites.length, nextSprites.length);

    for (let i = 0; i < length; i += 1) {
        if (oldSprites[i] && oldSprites[i].texture) {
            nextSprites[i].texture = oldSprites[i].texture;
        }
    }
}

function replaceContinueGameOverUi(scene) {
    if (!scene || scene.__es7ContinueGameOverUiReplaced) {
        return;
    }

    scene.__es7ContinueGameOverUiReplaced = true;

    if (scene.bigNumTxt && !(scene.bigNumTxt instanceof BigNumberDisplay)) {
        const oldBigNumber = scene.bigNumTxt;
        const bigNumber = new BigNumberDisplay(10);
        copyDisplayState(oldBigNumber, bigNumber);
        mirrorBigNumberTextures(oldBigNumber, bigNumber);
        scene.bigNumTxt = bigNumber;
        replaceDisplayObject(scene, oldBigNumber, bigNumber);
    }

    if (scene.twText && !(scene.twText instanceof TwitterButton)) {
        const oldTwitterButton = scene.twText;
        const twitterButton = new TwitterButton();
        copyDisplayState(oldTwitterButton, twitterButton);

        if (!scene._onContinueTweetPointerUp) {
            scene._onContinueTweetPointerUp = scene.tweet.bind(scene);
        }
        twitterButton.on("pointerup", scene._onContinueTweetPointerUp);

        scene.twText = twitterButton;
        replaceDisplayObject(scene, oldTwitterButton, twitterButton);
    }

    if (scene.gotoTitleBtn && !(scene.gotoTitleBtn instanceof GotoTitleButton)) {
        const oldGotoTitleButton = scene.gotoTitleBtn;
        const gotoTitleButton = new GotoTitleButton();
        copyDisplayState(oldGotoTitleButton, gotoTitleButton);

        if (!scene._onContinueGotoTitlePointerUp) {
            scene._onContinueGotoTitlePointerUp = () => {
                scene.nextSceneAnim();
            };
        }
        gotoTitleButton.on("pointerup", scene._onContinueGotoTitlePointerUp);

        scene.gotoTitleBtn = gotoTitleButton;
        replaceDisplayObject(scene, oldGotoTitleButton, gotoTitleButton);
    }
}

function wrapTimelineOnComplete(scene, callback) {
    const timeline = scene && scene.tl;
    if (!timeline || typeof timeline.eventCallback !== "function") {
        callback.call(scene);
        return;
    }

    const previousCallback = timeline.vars && typeof timeline.vars.onComplete === "function"
        ? timeline.vars.onComplete
        : null;
    const previousScope = timeline.vars && timeline.vars.onCompleteScope
        ? timeline.vars.onCompleteScope
        : scene;

    timeline.eventCallback("onComplete", function wrappedOnComplete() {
        if (previousCallback) {
            previousCallback.call(previousScope);
        }
        callback.call(scene);
    });
    timeline.eventCallback("onCompleteScope", scene);
}

if (!ContinueSceneCore.prototype.__es7ExtractedUiPatchApplied) {
    const originalRun = ContinueSceneCore.prototype.run;
    const originalSelectNo = ContinueSceneCore.prototype.selectNo;

    ContinueSceneCore.prototype.__es7ExtractedUiPatchApplied = true;

    ContinueSceneCore.prototype.run = function patchedRun(...args) {
        const result = originalRun.apply(this, args);
        replaceContinueChoiceButtons(this);
        return result;
    };

    ContinueSceneCore.prototype.selectNo = function patchedSelectNo(...args) {
        this.__es7ContinueGameOverUiReplaced = false;
        const result = originalSelectNo.apply(this, args);
        wrapTimelineOnComplete(this, function onSelectNoComplete() {
            replaceContinueGameOverUi(this);
        });
        return result;
    };
}

export class ContinueScene extends ContinueSceneCore {}

export default ContinueScene;
