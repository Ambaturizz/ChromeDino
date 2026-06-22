export class ScoreManager {
    constructor(uiManager) {
        this.ui = uiManager;
        this.score = 0;
        this.hiScore = parseInt(localStorage.getItem('dinoHiScore')) || 0;
        
        // Fitness stats
        this.jumps = 0;
        this.squats = 0;
        this.startTime = 0;
        
        this.ui.updateHiScore(this.hiScore);
    }

    reset() {
        this.score = 0;
        this.jumps = 0;
        this.squats = 0;
        this.startTime = Date.now();
        this.ui.updateScore(this.score);
    }

    increment() {
        this.score++;
        this.ui.updateScore(this.score);
    }
    
    addJump() {
        this.jumps++;
    }
    
    addSquat() {
        this.squats++;
    }

    calculateStats() {
        // Duration in seconds
        const durationSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        const durationMinutes = durationSeconds / 60;
        
        // Estimated Calories: (Minutes * 5) + (Jumps * 0.2) + (Squats * 0.2)
        const calories = (durationMinutes * 5) + (this.jumps * 0.2) + (this.squats * 0.2);
        
        // Format time MM:SS
        const mm = String(Math.floor(durationSeconds / 60)).padStart(2, '0');
        const ss = String(durationSeconds % 60).padStart(2, '0');
        
        // Check High Score
        if (this.score > this.hiScore) {
            this.hiScore = this.score;
            localStorage.setItem('dinoHiScore', this.hiScore);
            this.ui.updateHiScore(this.hiScore);
        }
        
        return {
            score: this.score,
            hiScore: this.hiScore,
            jumps: this.jumps,
            squats: this.squats,
            duration: `${mm}:${ss}`,
            calories: calories.toFixed(1)
        };
    }

    getScore() {
        return this.score;
    }
}
