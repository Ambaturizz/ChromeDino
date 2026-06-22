export class Dino {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.x = 50;
        this.y = 0;
        this.width = 44;
        this.height = 44;
        this.vy = 0;
        this.isJumping = false;
        this.isCrouching = false;
        this.groundY = 0;
    }

    resize(groundY) {
        this.groundY = groundY;
        if (!this.isJumping) {
            this.y = this.groundY - this.height;
        }
    }

    reset() {
        this.vy = 0;
        this.isJumping = false;
        this.isCrouching = false;
        this.height = 44;
        this.width = 44;
        this.y = this.groundY - this.height;
    }

    jump() {
        if (!this.isJumping) {
            this.vy = -12;
            this.isJumping = true;
        }
    }

    crouch(isCrouching) {
        this.isCrouching = isCrouching;
        if (isCrouching && !this.isJumping) {
            this.height = 22;
            this.width = 60;
            this.y = this.groundY - this.height;
        } else if (!isCrouching && !this.isJumping) {
            this.height = 44;
            this.width = 44;
            this.y = this.groundY - this.height;
        } else if (!isCrouching && this.isJumping) {
            this.height = 44;
            this.width = 44;
        }
    }

    update(gravity) {
        this.vy += gravity;
        
        // Fast fall if crouching while jumping
        if (this.isCrouching && this.isJumping) {
           this.vy += gravity * 2; 
        }
        
        this.y += this.vy;

        // Ground Collision
        if (this.y + this.height >= this.groundY) {
            this.y = this.groundY - this.height;
            this.vy = 0;
            this.isJumping = false;
        }
    }

    draw() {
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#38bdf8';
        this.ctx.fillStyle = '#38bdf8';
        
        this.ctx.beginPath();
        this.ctx.roundRect(this.x, this.y, this.width, this.height, 8);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
}
