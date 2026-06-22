export class ScoreManager {
    constructor(uiManager) {
        this.ui = uiManager;
        this.score = 0;
        this.hiScore = parseInt(localStorage.getItem('dinoHiScore')) || 0;
        this.ui.updateHiScore(this.hiScore);
    }

    reset() {
        this.score = 0;
        this.ui.updateScore(this.score);
    }

    increment() {
        this.score++;
        this.ui.updateScore(this.score);
    }

    checkHiScore() {
        if (this.score > this.hiScore) {
            this.hiScore = this.score;
            localStorage.setItem('dinoHiScore', this.hiScore);
            this.ui.updateHiScore(this.hiScore);
        }
    }

    getScore() {
        return this.score;
    }
}
