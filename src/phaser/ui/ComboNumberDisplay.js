export class ComboNumberDisplay {
    constructor(scene) {
        this.scene = scene;
        this.container = scene.add.container(194, 19);
        this.container.setDepth(101);
        this._sprites = [];
        this._lastNum = -1;
        this.setValue(0);
    }

    setValue(num) {
        if (this._lastNum === num) return;
        this._lastNum = num;
        for (var i = 0; i < this._sprites.length; i++) {
            this.container.remove(this._sprites[i], true);
        }
        this._sprites = [];
        var text = String(num);
        var x = 0;
        for (var i = 0; i < text.length; i++) {
            var frame = "comboNum" + text[i] + ".gif";
            try {
                var sprite = this.scene.add.image(x, 0, "game_ui", frame);
                sprite.setOrigin(0, 0);
                this.container.add(sprite);
                this._sprites.push(sprite);
                x += sprite.width;
            } catch (e) {}
        }
    }
}
