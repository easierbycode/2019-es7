export class BigNumberDisplay {
    constructor(scene, maxDigit) {
        this.scene = scene;
        this.container = scene.add.container(0, 0);
        this.sprites = [];
        this._lastVal = -1;
        for (var n = 0; n < maxDigit; n++) {
            var sp = scene.add.image((maxDigit - 1 - n) * 11, 0, "game_ui", "bigNum0.gif");
            sp.setOrigin(0, 0);
            this.container.add(sp);
            this.sprites.push(sp);
        }
    }

    setValue(val) {
        val = Math.max(0, Math.floor(val));
        if (this._lastVal === val) return;
        this._lastVal = val;
        var text = String(val);
        for (var i = 0; i < this.sprites.length; i++) {
            var digit = text.length > i ? text[text.length - 1 - i] : "0";
            try {
                this.sprites[i].setFrame("bigNum" + digit + ".gif");
            } catch (e) {}
        }
    }
}
