export class ParticleSystem {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.particles = [];
    }

    spawn(x, y, count) {
        for(let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 1) * 6,
                life: 1.0,
                color: `hsl(${Math.random() * 60 + 180}, 100%, 70%)` // Cyan/Blue colors
            });
        }
    }

    update() {
        for(let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
            if(p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw() {
        this.ctx.save();
        for(let p of this.particles) {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, Math.random() * 4 + 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }
}
