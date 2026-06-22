/**
 * ObstacleManager.js
 * Manages spawning, updating, and rendering of all obstacles:
 *   - Ground-level cacti (avoided by jumping)
 *   - Flying birds (avoided by crouching)
 */
export class ObstacleManager {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {CanvasRenderingContext2D} ctx
     */
    constructor(canvas, ctx) {
        this.canvas    = canvas;
        this.ctx       = ctx;
        this.obstacles = [];
        this.speed     = 7;

        // Minimum gap between spawn events (frames)
        this.minGap    = 90;
        this.gapTimer  = this.minGap;
        this.wingFrame = 0;
        this.wingTimer = 0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    reset() {
        this.obstacles = [];
        this.speed     = 7;
        this.gapTimer  = this.minGap;
    }

    increaseSpeed(amount) {
        this.speed = Math.min(this.speed + amount, 28);
        // Also tighten gap as speed grows
        this.minGap = Math.max(55, this.minGap - 2);
    }

    /**
     * @param {number} groundY    - pixel Y of the ground line
     * @param {number} score
     * @param {number} frame
     */
    update(groundY, score, frame) {
        // Advance spawn timer
        this.gapTimer--;
        if (this.gapTimer <= 0) {
            this._spawn(groundY, score);
            // Randomize next gap: 90-160 frames
            this.gapTimer = this.minGap + Math.floor(Math.random() * 70);
        }

        // Move obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const o = this.obstacles[i];
            o.x -= this.speed;
            if (o.x + o.width < -20) this.obstacles.splice(i, 1);
        }

        // Wing animation
        this.wingTimer++;
        if (this.wingTimer > 12) { this.wingFrame ^= 1; this.wingTimer = 0; }
    }

    draw(isNight) {
        for (const o of this.obstacles) {
            o.type === 'bird' ? this._drawBird(o, isNight) : this._drawCactus(o, isNight);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private
    // ─────────────────────────────────────────────────────────────────────────

    _spawn(groundY, score) {
        const W = this.canvas.width;

        // Birds unlock after score 100
        const canBird = score > 100 && Math.random() > 0.55;

        if (canBird) {
            // Bird flies at: high (above jump peak), mid (crouch height), or low
            const heights = [
                groundY - 90,   // HIGH – must jump (or just run under)
                groundY - 55,   // MID  – must crouch
                groundY - 40,   // LOW  – must crouch
            ];
            const y = heights[Math.floor(Math.random() * heights.length)];
            this.obstacles.push({
                type  : 'bird',
                x     : W + 40,
                y,
                width : 48,
                height: 24,
            });
        } else {
            // Cactus – random cluster size
            const clusters = [1, 1, 1, 2, 3];
            const count    = clusters[Math.floor(Math.random() * clusters.length)];
            const cactusW  = 20 + Math.floor(Math.random() * 14);
            const cactusH  = 45 + Math.floor(Math.random() * 30);
            this.obstacles.push({
                type  : 'cactus',
                x     : W + 20,
                y     : groundY - cactusH,
                width : cactusW + (count - 1) * 22,
                height: cactusH,
                count,
            });
        }
    }

    _drawCactus(o, isNight) {
        const ctx   = this.ctx;
        const color = isNight ? '#4ade80' : '#22c55e';
        const glow  = isNight ? '#bbf7d0' : '#86efac';

        ctx.shadowBlur  = 10;
        ctx.shadowColor = glow;
        ctx.fillStyle   = color;

        for (let i = 0; i < (o.count || 1); i++) {
            const cx = o.x + i * 22;
            const cy = o.y;
            const cw = 18;
            const ch = o.height;

            // Main trunk
            ctx.beginPath(); ctx.roundRect(cx + 4, cy, cw - 8, ch, 3); ctx.fill();
            // Arms
            const armY = cy + ch * 0.35;
            ctx.beginPath(); ctx.roundRect(cx - 4, armY, 7, ch * 0.28, 3); ctx.fill();
            ctx.beginPath(); ctx.roundRect(cx + cw - 4, armY + ch * 0.06, 7, ch * 0.22, 3); ctx.fill();
            // Arm tops
            ctx.beginPath(); ctx.roundRect(cx - 4, armY - 8, 9, 9, 3); ctx.fill();
            ctx.beginPath(); ctx.roundRect(cx + cw - 6, armY + ch * 0.06 - 8, 9, 9, 3); ctx.fill();
        }

        ctx.shadowBlur = 0;
    }

    _drawBird(o, isNight) {
        const ctx   = this.ctx;
        const color = isNight ? '#c084fc' : '#a855f7';
        const glow  = isNight ? '#e9d5ff' : '#d8b4fe';

        ctx.shadowBlur  = 14;
        ctx.shadowColor = glow;
        ctx.fillStyle   = color;

        const { x, y, width: w, height: h } = o;
        const midX = x + w / 2;
        const midY = y + h / 2;

        // Body
        ctx.beginPath();
        ctx.ellipse(midX, midY, w * 0.28, h * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wings
        const wingUp = this.wingFrame === 0 ? -h * 0.6 : h * 0.4;
        ctx.beginPath();
        ctx.moveTo(midX, midY - h * 0.1);
        ctx.quadraticCurveTo(midX - w * 0.55, midY + wingUp, midX - w * 0.48, midY + h * 0.05);
        ctx.quadraticCurveTo(midX - w * 0.2, midY + h * 0.2, midX, midY + h * 0.1);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(midX, midY - h * 0.1);
        ctx.quadraticCurveTo(midX + w * 0.55, midY + wingUp, midX + w * 0.48, midY + h * 0.05);
        ctx.quadraticCurveTo(midX + w * 0.2, midY + h * 0.2, midX, midY + h * 0.1);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(midX + w * 0.18, midY - h * 0.1, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath(); ctx.arc(midX + w * 0.20, midY - h * 0.08, 2, 0, Math.PI * 2); ctx.fill();

        // Beak
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(midX + w * 0.3, midY);
        ctx.lineTo(midX + w * 0.48, midY - h * 0.08);
        ctx.lineTo(midX + w * 0.48, midY + h * 0.08);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
    }
}
