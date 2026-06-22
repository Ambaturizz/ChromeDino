/**
 * ParticleSystem.js
 * Manages a pool of short-lived particle effects (jump sparks, crash burst).
 */
export class ParticleSystem {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {CanvasRenderingContext2D} ctx
     */
    constructor(canvas, ctx) {
        this.canvas    = canvas;
        this.ctx       = ctx;
        this.particles = [];
    }

    /**
     * Spawn a burst of particles.
     * @param {number} x
     * @param {number} y
     * @param {number} count
     * @param {'jump'|'crash'|'score'} type
     */
    spawn(x, y, count, type = 'jump') {
        const palettes = {
            jump : ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd'],
            crash: ['#ef4444', '#f97316', '#fbbf24', '#ffffff'],
            score: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
        };
        const pal = palettes[type] || palettes.jump;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            this.particles.push({
                x,
                y,
                vx   : Math.cos(angle) * speed,
                vy   : Math.sin(angle) * speed - (type === 'jump' ? 2 : 0),
                life : 1.0,
                decay: 0.03 + Math.random() * 0.03,
                size : 2 + Math.random() * 4,
                color: pal[Math.floor(Math.random() * pal.length)],
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x    += p.vx;
            p.y    += p.vy;
            p.vy   += 0.2; // Gravity on particles
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw() {
        const ctx = this.ctx;
        ctx.save();
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle   = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}
