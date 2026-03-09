export function showScorePopup(scene, x, y, score) {
    var txt = scene.add.text(x, y, String(score), {
        fontFamily: "Arial",
        fontSize: "10px",
        fontStyle: "bold",
        color: "#ffff00",
        stroke: "#000000",
        strokeThickness: 2,
    });
    txt.setOrigin(0.5);
    txt.setDepth(110);
    scene.tweens.add({
        targets: txt,
        y: y - 20,
        alpha: 0,
        duration: 800,
        onComplete: function () { txt.destroy(); },
    });
}
