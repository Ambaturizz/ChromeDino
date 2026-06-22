/**
 * Dino.js
 * Manages the player character's state, physics, and rendering.
 * Supports running, jumping, and crouching animations using canvas shapes.
 */
export class Dino {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {CanvasRenderingContext2D} ctx
     */
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx    = ctx;

        // ── Geometry ──────────────────────────────────────────────────────────
        this.x       = 80;
        this.y       = 0;
        this.groundY = 0;

        // Stand dimensions
        this.STAND_W = 40;
        this.STAND_H = 48;
        // Crouch dimensions
        this.CROUCH_W = 58;
        this.CROUCH_H = 26;

        this.width  = this.STAND_W;
        this.height = this.STAND_H;

        // ── Physics ───────────────────────────────────────────────────────────
        this.vy          = 0;
        this.gravity     = 0.85;
        this.jumpStrength = -14;
        this.isJumping   = false;
        this.isCrouching = false;

        // ── Animation ─────────────────────────────────────────────────────────
        this.legFrame = 0;   // 0 or 1 (alternating legs)
        this.legTimer = 0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────────────────

    resize(groundY) {
        this.groundY = groundY;
        if (!this.isJumping) this.y = groundY - this.height;
    }

    reset() {
        this.vy          = 0;
        this.isJumping   = false;
        this.isCrouching = false;
        this.width       = this.STAND_W;
        this.height      = this.STAND_H;
        this.y           = this.groundY - this.height;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Actions
    // ─────────────────────────────────────────────────────────────────────────

    jump() {
        if (!this.isJumping) {
            this.vy        = this.jumpStrength;
            this.isJumping = true;
        }
    }

    crouch(active) {
        this.isCrouching = active;
        if (active && !this.isJumping) {
            this.width  = this.CROUCH_W;
            this.height = this.CROUCH_H;
            this.y      = this.groundY - this.height;
        } else if (!active && !this.isJumping) {
            this.width  = this.STAND_W;
            this.height = this.STAND_H;
            this.y      = this.groundY - this.height;
        } else if (!active && this.isJumping) {
            this.width  = this.STAND_W;
            this.height = this.STAND_H;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Update & Draw
    // ─────────────────────────────────────────────────────────────────────────

    update() {
        // Physics
        let grav = this.gravity;
        if (this.isCrouching && this.isJumping) grav *= 2.5; // fast-fall
        this.vy += grav;
        this.y  += this.vy;

        // Land
        if (this.y + this.height >= this.groundY) {
            this.y         = this.groundY - this.height;
            this.vy        = 0;
            this.isJumping = false;
        }

        // Leg animation (only while running)
        if (!this.isJumping) {
            this.legTimer++;
            if (this.legTimer > 6) { this.legFrame ^= 1; this.legTimer = 0; }
        }
    }

    draw(isNight) {
        const ctx = this.ctx;
        const x = this.x, y = this.y, w = this.width, h = this.height;

        const bodyColor  = '#0ea5e9';
        const glowColor  = isNight ? '#818cf8' : '#0ea5e9';
        const accentColor = '#bae6fd';

        ctx.shadowBlur  = 14;
        ctx.shadowColor = glowColor;

        if (this.isCrouching && !this.isJumping) {
            this._drawCrouchBody(ctx, x, y, w, h, bodyColor, accentColor);
        } else {
            this._drawStandBody(ctx, x, y, w, h, bodyColor, accentColor);
        }

        ctx.shadowBlur = 0;
    }

    _drawStandBody(ctx, x, y, w, h, body, accent) {
        // Torso
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h * 0.65, 8);
        ctx.fill();

        // Eye
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(x + w * 0.75, y + h * 0.2, 5, 0, Math.PI * 2);
        ctx.fill();

        // Pupil
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(x + w * 0.78, y + h * 0.2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        const legW = 9, legH = h * 0.38;
        const leg1X = this.legFrame === 0 ? x + 6  : x + 6  + 4;
        const leg2X = this.legFrame === 0 ? x + 22 : x + 22 - 4;
        ctx.fillStyle = body;
        ctx.beginPath(); ctx.roundRect(leg1X, y + h * 0.6, legW, legH, 4); ctx.fill();
        ctx.beginPath(); ctx.roundRect(leg2X, y + h * 0.6, legW, legH, 4); ctx.fill();

        // Arm
        ctx.fillStyle = body;
        ctx.beginPath(); ctx.roundRect(x + w - 4, y + h * 0.25, 6, h * 0.3, 3); ctx.fill();
    }

    _drawCrouchBody(ctx, x, y, w, h, body, accent) {
        // Wide flat body
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 10);
        ctx.fill();

        // Eye (moved)
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(x + w * 0.82, y + h * 0.35, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(x + w * 0.85, y + h * 0.35, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
}
