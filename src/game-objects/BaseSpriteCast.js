export class BaseSpriteCast extends PIXI.Sprite {
    constructor(texture) {
        super(texture);

        this._onCastAdded = this._handleCastAdded.bind(this);
        this._onCastRemoved = this._handleCastRemoved.bind(this);

        this.on("added", this._onCastAdded);
        this.on("removed", this._onCastRemoved);
    }

    _handleCastAdded(parent) {
        this.castAdded(parent);
    }

    _handleCastRemoved(parent) {
        this.castRemoved(parent);
    }

    castAdded() {}

    castRemoved() {}

    destroy(options) {
        this.off("added", this._onCastAdded);
        this.off("removed", this._onCastRemoved);
        super.destroy(options);
    }
}

export const BaseSprite = BaseSpriteCast;
export default BaseSpriteCast;
