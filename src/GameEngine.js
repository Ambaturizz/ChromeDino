import { Dino } from './Dino.js';
import { ObstacleManager } from './ObstacleManager.js';
import { CollisionSystem } from './CollisionSystem.js';
import { ParticleSystem } from './ParticleSystem.js';
import { SoundManager } from './SoundManager.js';

export class GameEngine {
    constructor(canvasId, uiManager, scoreManager) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.ui = uiManager;
        this.scoreMgr = scoreManager;
        
        this.state = 'START'; 
        this.gravity = 0.8; // slightly higher gravity for snappier feel
        this.frame = 0;
        this.animationId = null;
        
        this.shakeTime = 0;
        
        this.dino = new Dino(this.canvas, this.ctx);
        this.obstaclesMgr = new ObstacleManager(this.canvas, this.ctx);
        this.particles = new ParticleSystem(this.canvas, this.ctx);
        this.sound = new SoundManager();
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.onGameOver = null;
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        const groundY = this.canvas.height - 120; // higher ground
        this.dino.resize(groundY);
    }

    start() {
        this.state = 'PLAYING';
        this.frame = 0;
        this.shakeTime = 0;
        this.scoreMgr.reset();
        this.dino.reset();
        this.obstaclesMgr.reset();
        this.particles.particles = [];
        
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.loop();
    }

    handleInput(action) { 
        if (this.state !== 'PLAYING') return;
        
        if (action === 'JUMP' && !this.dino.isJumping) {
            this.dino.jump();
            this.sound.playJump();
            // Spawn particles at feet
            this.particles.spawn(this.dino.x + this.dino.width/2, this.dino.groundY, 15);
        } else if (action === 'CROUCH_ON') {
            this.dino.crouch(true);
        } else if (action === 'CROUCH_OFF') {
            this.dino.crouch(false);
        }
    }

    update() {
        this.dino.update(this.gravity);
        this.obstaclesMgr.update();
        this.particles.update();
        
        if(this.shakeTime > 0) this.shakeTime--;

        if (this.frame % 70 === 0 && this.frame > 0) {
            this.obstaclesMgr.spawn(this.dino.groundY, this.scoreMgr.getScore());
        }

        if (CollisionSystem.check(this.dino, this.obstaclesMgr.obstacles)) {
            this.gameOver();
        }

        this.frame++;
        if (this.frame % 5 === 0) {
            this.scoreMgr.increment();
            if (this.scoreMgr.getScore() % 100 === 0) {
                this.obstaclesMgr.increaseSpeed(0.8);
                this.sound.playScore();
            }
        }
    }

    draw() {
        this.ctx.save();
        
        // Screen shake
        if (this.shakeTime > 0) {
            const dx = (Math.random() - 0.5) * 20;
            const dy = (Math.random() - 0.5) * 20;
            this.ctx.translate(dx, dy);
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid background for futuristic feel
        this.drawGrid();

        // Glowing Ground Line
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.dino.groundY);
        this.ctx.lineTo(this.canvas.width, this.dino.groundY);
        this.ctx.strokeStyle = '#0ea5e9';
        this.ctx.lineWidth = 4;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#0ea5e9';
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        this.particles.draw();
        this.dino.draw();
        this.obstaclesMgr.draw();
        
        this.ctx.restore();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(14, 165, 233, 0.1)';
        this.ctx.lineWidth = 1;
        const gridSize = 50;
        
        // Move grid with speed
        const offset = (this.frame * this.obstaclesMgr.speed) % gridSize;
        
        this.ctx.beginPath();
        for(let x = -offset; x < this.canvas.width; x += gridSize) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
        }
        for(let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
        }
        this.ctx.stroke();
    }

    loop() {
        if (this.state === 'PLAYING') {
            this.update();
            this.draw();
            this.animationId = requestAnimationFrame(() => this.loop());
        } else if (this.state === 'GAME_OVER' && this.shakeTime > 0) {
            // Keep drawing to show screen shake then stop
            this.shakeTime--;
            this.draw();
            this.animationId = requestAnimationFrame(() => this.loop());
        }
    }

    gameOver() {
        this.state = 'GAME_OVER';
        this.shakeTime = 30; // 30 frames of shake
        this.sound.playCrash();
        this.particles.spawn(this.dino.x + this.dino.width/2, this.dino.y + this.dino.height/2, 50);
        this.scoreMgr.checkHiScore();
        if (this.onGameOver) this.onGameOver();
    }
}
