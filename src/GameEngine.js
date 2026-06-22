/**
 * GameEngine.js
 * Orchestrates the entire game loop using requestAnimationFrame with a
 * fixed-timestep accumulator to ensure stable 60 FPS physics regardless
 * of monitor refresh rate.
 *
 * Responsibilities:
 *   - Fixed-timestep game loop (16.67 ms per tick)
 *   - Canvas resize handling
 *   - Wiring Dino, ObstacleManager, CollisionSystem, ParticleSystem, SoundManager
 *   - Screen shake on collision
 *   - Day/Night & Weather delegation to Environment
 */

import { Dino }            from './Dino.js';
import { ObstacleManager } from './ObstacleManager.js';
import { CollisionSystem } from './CollisionSystem.js';
import { ParticleSystem }  from './ParticleSystem.js';
import { SoundManager }    from './SoundManager.js';
import { Environment }     from './Environment.js';

export class GameEngine {
    /**
     * @param {string}       canvasId
     * @param {UIManager}    uiManager
     * @param {ScoreManager} scoreManager
     */
    constructor(canvasId, uiManager, scoreManager) {
        this.canvas    = document.getElementById(canvasId);
        this.ctx       = this.canvas.getContext('2d');
        this.ui        = uiManager;
        this.scoreMgr  = scoreManager;

        // ── Game state ────────────────────────────────────────────────────────
        this.state = 'START'; // 'START' | 'PLAYING' | 'GAME_OVER'

        // ── Fixed-timestep loop ───────────────────────────────────────────────
        this.TICK_MS       = 1000 / 60;   // 16.67 ms
        this.accumulator   = 0;
        this.lastTimestamp = 0;
        this.rafId         = null;
        this.frame         = 0;

        // ── Screen shake ──────────────────────────────────────────────────────
        this.shakeFrames = 0;
        this.shakeMag    = 0;

        // ── Modules ───────────────────────────────────────────────────────────
        this.dino        = new Dino(this.canvas, this.ctx);
        this.obstacles   = new ObstacleManager(this.canvas, this.ctx);
        this.particles   = new ParticleSystem(this.canvas, this.ctx);
        this.sound       = new SoundManager();
        this.environment = new Environment(this.canvas, this.ctx);

        // ── Callbacks ─────────────────────────────────────────────────────────
        this.onGameOver = null; // set by main.js

        // ── Init ──────────────────────────────────────────────────────────────
        this._resize();
        window.addEventListener('resize', () => this._resize());

        // Draw a static first frame so the canvas isn't blank
        this._drawFrame();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    start() {
        this.state        = 'PLAYING';
        this.frame        = 0;
        this.accumulator  = 0;
        this.lastTimestamp = performance.now();
        this.shakeFrames  = 0;

        this.scoreMgr.reset();
        this.dino.reset();
        this.obstacles.reset();
        this.particles.particles = [];

        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = requestAnimationFrame(ts => this._loop(ts));
    }

    /**
     * Dispatch a control action from PoseDetector or keyboard.
     * @param {'JUMP'|'CROUCH_ON'|'CROUCH_OFF'} action
     */
    handleInput(action) {
        if (this.state !== 'PLAYING') return;

        if (action === 'JUMP' && !this.dino.isJumping) {
            this.dino.jump();
            this.sound.playJump();
            this.particles.spawn(
                this.dino.x + this.dino.width / 2,
                this.dino.groundY,
                18, 'jump'
            );
            this.scoreMgr.addJump();
        } else if (action === 'CROUCH_ON') {
            if (!this.dino.isCrouching && !this.dino.isJumping) {
                this.scoreMgr.addSquat();
                this.sound.playDuck();
            }
            this.dino.crouch(true);
        } else if (action === 'CROUCH_OFF') {
            this.dino.crouch(false);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private: loop
    // ─────────────────────────────────────────────────────────────────────────

    _loop(timestamp) {
        if (this.state === 'GAME_OVER' && this.shakeFrames <= 0) return;

        const delta = Math.min(timestamp - this.lastTimestamp, 100); // cap spike
        this.lastTimestamp = timestamp;
        this.accumulator  += delta;

        // Fixed-timestep: run as many ticks as accumulated
        while (this.accumulator >= this.TICK_MS) {
            this._tick();
            this.accumulator -= this.TICK_MS;
        }

        this._drawFrame();

        this.rafId = requestAnimationFrame(ts => this._loop(ts));
    }

    /** One logical game update at exactly 1/60 s. */
    _tick() {
        if (this.state !== 'PLAYING') {
            if (this.shakeFrames > 0) this.shakeFrames--;
            return;
        }

        this.frame++;
        this.environment.update(this.obstacles.speed);
        this.ui.updateWeather(this.environment.currentWeather);

        this.dino.update();
        this.obstacles.update(this.dino.groundY, this.scoreMgr.getScore(), this.frame);
        this.particles.update();

        if (this.shakeFrames > 0) this.shakeFrames--;

        // Collision
        if (CollisionSystem.check(this.dino, this.obstacles.obstacles)) {
            this._triggerGameOver();
            return;
        }

        // Score tick (every 5 logic frames)
        if (this.frame % 5 === 0) {
            this.scoreMgr.increment();
            const score = this.scoreMgr.getScore();

            // Speed milestone every 100 points
            if (score % 100 === 0) {
                this.obstacles.increaseSpeed(0.7);
                this.sound.playScore();
                this.particles.spawn(
                    this.dino.x + this.dino.width / 2,
                    this.dino.y,
                    20, 'score'
                );
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private: drawing
    // ─────────────────────────────────────────────────────────────────────────

    _drawFrame() {
        const ctx = this.ctx;
        ctx.save();

        // Screen shake
        if (this.shakeFrames > 0) {
            const mag = this.shakeMag * (this.shakeFrames / 30);
            ctx.translate(
                (Math.random() - 0.5) * mag * 2,
                (Math.random() - 0.5) * mag * 2
            );
        }

        // Background
        this.environment.draw(this.frame, this.obstacles.speed);

        // Moving grid overlay
        this._drawGrid();

        // Ground
        this.environment.drawGround(this.dino.groundY);

        // Game objects
        this.particles.draw();
        this.dino.draw(this.environment && !this.environment.isDay);
        this.obstacles.draw(this.environment && !this.environment.isDay);

        ctx.restore();
    }

    _drawGrid() {
        const { canvas: cv, ctx } = this;
        const alpha = this.environment.isDay ? 0.04 : 0.08;
        ctx.strokeStyle = `rgba(14,165,233,${alpha})`;
        ctx.lineWidth   = 1;
        const size      = 60;
        const offset    = (this.frame * (this.obstacles.speed * 0.25)) % size;

        ctx.beginPath();
        for (let x = -offset; x < cv.width; x += size) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, cv.height);
        }
        for (let y = 0; y < cv.height; y += size) {
            ctx.moveTo(0, y);
            ctx.lineTo(cv.width, y);
        }
        ctx.stroke();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private: game over
    // ─────────────────────────────────────────────────────────────────────────

    _triggerGameOver() {
        this.state       = 'GAME_OVER';
        this.shakeFrames = 30;
        this.shakeMag    = 18;

        this.sound.playCrash();
        this.particles.spawn(
            this.dino.x + this.dino.width / 2,
            this.dino.y + this.dino.height / 2,
            60, 'crash'
        );

        const stats = this.scoreMgr.calculateStats();
        if (this.onGameOver) this.onGameOver(stats);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private: resize
    // ─────────────────────────────────────────────────────────────────────────

    _resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width  = rect.width;
        this.canvas.height = rect.height;
        this.dino.resize(this.canvas.height - 110);
        // Reflect new canvas size in environment
        this.environment.canvas = this.canvas;
        this.obstacles.canvas   = this.canvas;
    }
}
