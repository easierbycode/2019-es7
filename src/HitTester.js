export class HitTester {
    static hitTestFunc(obj1, obj2) {
        if (!obj1 || !obj2 || !obj1.hitArea || !obj2.hitArea) {
            return false;
        }

        const bounds1 = obj1.getBounds();
        const bounds2 = obj2.getBounds();

        const hitArea1 = new PIXI.Rectangle(
            bounds1.x + obj1.hitArea.x,
            bounds1.y + obj1.hitArea.y,
            obj1.hitArea.width,
            obj1.hitArea.height
        );

        const hitArea2 = new PIXI.Rectangle(
            bounds2.x + obj2.hitArea.x,
            bounds2.y + obj2.hitArea.y,
            obj2.hitArea.width,
            obj2.hitArea.height
        );

        return hitArea1.x < hitArea2.x + hitArea2.width
            && hitArea1.x + hitArea1.width > hitArea2.x
            && hitArea1.y < hitArea2.y + hitArea2.height
            && hitArea1.y + hitArea1.height > hitArea2.y;
    }
}

export default HitTester;
