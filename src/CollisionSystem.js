/**
 * CollisionSystem.js
 * Stateless utility for AABB collision detection with configurable padding.
 */
export class CollisionSystem {
    /**
     * @param {Object} dino       - { x, y, width, height }
     * @param {Array}  obstacles  - array of { x, y, width, height }
     * @param {number} [padding=6]
     * @returns {boolean}
     */
    static check(dino, obstacles, padding = 6) {
        const dx1 = dino.x + padding;
        const dy1 = dino.y + padding;
        const dx2 = dino.x + dino.width  - padding;
        const dy2 = dino.y + dino.height - padding;

        for (const o of obstacles) {
            const ox1 = o.x + padding;
            const oy1 = o.y + padding;
            const ox2 = o.x + o.width  - padding;
            const oy2 = o.y + o.height - padding;

            if (dx1 < ox2 && dx2 > ox1 && dy1 < oy2 && dy2 > oy1) {
                return true;
            }
        }
        return false;
    }
}
