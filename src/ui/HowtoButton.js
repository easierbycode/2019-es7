import { FrameButton } from "./FrameButton.js";

export class HowtoButton extends FrameButton {
    constructor() {
        super("howtoBtn0.gif", "howtoBtn1.gif", "howtoBtn2.gif");
    }

    onUp(event) {
        super.onUp(event);
        if (typeof window !== "undefined" && typeof window.howtoModalOpen === "function") {
            window.howtoModalOpen();
        }
    }
}

export default HowtoButton;
