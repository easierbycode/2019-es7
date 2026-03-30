// src/phaser/game-objects/Shadow.js
// Shadow creation and positioning helpers
// Mirrors PIXI BaseUnit shadow: same sprite tinted black, alpha 0.5, optionally Y-flipped

/**
 * Creates a shadow sprite for a game object.
 *
 * PIXI BaseUnit: shadow uses same texture frame, tint=0x000000, alpha=0.5.
 * When shadowReverse is true, scaleY=-1 flips the shadow vertically.
 * Shadow is added at a lower depth so it renders behind the character.
 *
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Sprite} sprite  - the owner sprite
 * @param {string} frameKey                   - atlas frame for the shadow
 * @param {boolean} shadowReverse             - whether to Y-flip the shadow
 * @param {number} shadowOffsetY              - vertical offset (pixels above shadow base)
 * @returns {Phaser.GameObjects.Sprite}
 */
export function createShadow(scene, sprite, frameKey, shadowReverse, shadowOffsetY, textureKey) {
    var shadow = scene.add.sprite(sprite.x, sprite.y, textureKey || "game_asset", frameKey);
    shadow.setOrigin(0.5);
    shadow.setTint(0x000000).setTintMode(Phaser.TintModes.FILL);
    shadow.setAlpha(0.5);
    shadow.setDepth((sprite.depth || 0) - 1);
    if (shadowReverse) {
        shadow.setScale(1, -1);
    }
    shadow.setData("shadowReverse", shadowReverse);
    shadow.setData("shadowOffsetY", shadowOffsetY);
    return shadow;
}

/**
 * Updates a shadow's position to follow its owner sprite.
 *
 * PIXI original uses anchor(0,0) for both character and shadow.
 * Non-reversed: shadow.y = h - offsetY (renders downward from top-left)
 * Reversed:     shadow.y = 2*h - offsetY (scaleY=-1 renders upward from anchor)
 * Both produce the same visual center at (h - offsetY) below the character center.
 *
 * In Phaser with origin(0.5), sprite.y is already the character center, so:
 *   shadow.y = sprite.y + sprite.height - offsetY
 *
 * @param {Phaser.GameObjects.Sprite} shadow
 * @param {Phaser.GameObjects.Sprite} sprite
 */
export function updateShadowPosition(shadow, sprite) {
    shadow.x = sprite.x;
    var offsetY = shadow.getData("shadowOffsetY") || 0;
    shadow.y = sprite.y + sprite.height - offsetY;
}
