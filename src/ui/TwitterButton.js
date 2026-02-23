import { FrameButton } from "./FrameButton.js";

export class TwitterButton extends FrameButton {
    constructor() {
        super("twitterBtn0.gif", "twitterBtn1.gif", "twitterBtn2.gif");
        this.anchor.set(0.5);
    }
}

export default TwitterButton;
