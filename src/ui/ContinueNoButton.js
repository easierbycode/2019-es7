import { FrameButton } from "./FrameButton.js";

export class ContinueNoButton extends FrameButton {
    constructor() {
        super("continueNo.gif", "continueNoOver.gif", "continueNoDown.gif");
    }
}

export default ContinueNoButton;
