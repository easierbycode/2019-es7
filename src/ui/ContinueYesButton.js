import { FrameButton } from "./FrameButton.js";
import { play } from "../soundManager.js";

export class ContinueYesButton extends FrameButton {
    constructor() {
        super("continueYes.gif", "continueYesOver.gif", "continueYesDown.gif");
    }

    onUp() {
        play("se_correct");
        this.texture = this.textureDefault;
    }
}

export default ContinueYesButton;
