export class CollisionSystem {
    /**
     * Checks collision between Dino and an array of obstacles.
     * @param {Object} dino 
     * @param {Array} obstacles 
     * @returns {boolean} true if collision is detected
     */
    static check(dino, obstacles) {
        const padding = 8; // Increased leeway for faster game
        
        for (let obs of obstacles) {
            if (
                dino.x < obs.x + obs.width &&
                dino.x + dino.width > obs.x &&
                dino.y < obs.y + obs.height &&
                dino.y + dino.height > obs.y
            ) {
                if (
                    dino.x + padding < obs.x + obs.width - padding &&
                    dino.x + dino.width - padding > obs.x + padding &&
                    dino.y + padding < obs.y + obs.height - padding &&
                    dino.y + dino.height - padding > obs.y + padding
                ) {
                    return true;
                }
            }
        }
        return false;
    }
}
