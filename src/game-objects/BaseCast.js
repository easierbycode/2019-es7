export class BaseCast extends PIXI.Container {
    constructor(id) {
        super();

        this.id = id;
        this.parentNode = null;

        this._onCastAdded = this._handleCastAdded.bind(this);
        this._onCastRemoved = this._handleCastRemoved.bind(this);

        this.on("added", this._onCastAdded);
        this.on("removed", this._onCastRemoved);
    }

    _handleCastAdded(parent) {
        this.parentNode = parent || this.parent || null;
        this.castAdded(parent);
    }

    _handleCastRemoved(parent) {
        this.parentNode = null;
        this.castRemoved(parent);
    }

    castAdded() {}

    castRemoved() {}

    destroy(options) {
        this.off("added", this._onCastAdded);
        this.off("removed", this._onCastRemoved);
        this.parentNode = null;
        super.destroy(options);
    }
}

export default BaseCast;
