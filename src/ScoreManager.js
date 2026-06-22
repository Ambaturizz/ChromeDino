/**
 * ScoreManager.js
 * Tracks score, high score, fitness metrics, and session timing.
 * High score is persisted to localStorage.
 */
export class ScoreManager {
    /** @param {UIManager} uiManager */
    constructor(uiManager) {
        this.ui      = uiManager;
        this.score   = 0;
        this.hiScore = parseInt(localStorage.getItem('dinoHiScore')) || 0;

        // Fitness stats
        this.jumps     = 0;
        this.squats    = 0;
        this.startTime = 0;

        this.ui.updateHiScore(this.hiScore);
    }

    reset() {
        this.score     = 0;
        this.jumps     = 0;
        this.squats    = 0;
        this.startTime = performance.now();
        this.ui.updateScore(this.score);
    }

    /** Called every score-tick frame (every 5 game frames). */
    increment() {
        this.score++;
        this.ui.updateScore(this.score);
    }

    addJump()  { this.jumps++; }
    addSquat() { this.squats++; }

    getScore() { return this.score; }

    /**
     * Finalize session and return full stats object.
     * @returns {{ score, hiScore, jumps, squats, duration, calories }}
     */
    calculateStats() {
        const durationMs  = performance.now() - this.startTime;
        const durationSec = Math.floor(durationMs / 1000);
        const durationMin = durationMs / 60000;
        const calories    = (durationMin * 5 + this.jumps * 0.2 + this.squats * 0.2).toFixed(1);

        const mm = String(Math.floor(durationSec / 60)).padStart(2, '0');
        const ss = String(durationSec % 60).padStart(2, '0');

        if (this.score > this.hiScore) {
            this.hiScore = this.score;
            localStorage.setItem('dinoHiScore', this.hiScore);
            this.ui.updateHiScore(this.hiScore);
        }

        return {
            score   : this.score,
            hiScore : this.hiScore,
            jumps   : this.jumps,
            squats  : this.squats,
            duration: `${mm}:${ss}`,
            calories,
        };
    }
}
