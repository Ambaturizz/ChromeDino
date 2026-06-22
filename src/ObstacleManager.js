export class ObstacleManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.obstacles = [];
        this.speed = 8; // Faster starting speed for modern feel
    }

    reset() {
        this.obstacles = [];
        this.speed = 8;
    }

    increaseSpeed(amount) {
        this.speed += amount;
    }

    spawn(groundY, score) {
        let spawnChance = Math.random();
        if (spawnChance > 0.3) {
            let type = Math.random() > 0.5 ? 'small' : 'large';
            let width = type === 'small' ? 25 : 40;
            let height = type === 'small' ? 50 : 75;
            
            let isFlying = Math.random() > 0.7 && score > 150; // Fly earlier
            let yPos = groundY - height;
            
            if (isFlying) {
               yPos -= Math.random() > 0.5 ? 30 : 80; // Low or high flying
               width = 50;
               height = 30;
               type = 'flying';
            }
            
            this.obstacles.push({
                x: this.canvas.width,
                y: yPos,
                width: width,
                height: height,
                type: type,
                glow: type === 'flying' ? '#a855f7' : '#ef4444' // Purple or Red
            });
        }
    }

    update() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            let obs = this.obstacles[i];
            obs.x -= this.speed;

            if (obs.x + obs.width < 0) {
                this.obstacles.splice(i, 1);
            }
        }
    }

    draw() {
        for (let obs of this.obstacles) {
            this.ctx.shadowColor = obs.glow;
            this.ctx.fillStyle = obs.glow;
            
            this.ctx.shadowBlur = 15;
            this.ctx.beginPath();
            this.ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 8);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            
            // Inner core for futuristic look
            this.ctx.fillStyle = '#ffffff';
            this.ctx.globalAlpha = 0.5;
            this.ctx.beginPath();
            this.ctx.roundRect(obs.x + 5, obs.y + 5, obs.width - 10, obs.height - 10, 4);
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        }
    }
}
