export class UIManager {
    constructor() {
        this.poseStatusEl = document.getElementById('poseStatus');
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.hiScoreDisplay = document.getElementById('hiScoreDisplay');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.startBtn = document.getElementById('startBtn');
        this.loadingCam = document.getElementById('loadingCam');
    }

    updatePoseStatus(status) {
        this.poseStatusEl.innerText = status;
        this.poseStatusEl.className = `status-value ${status.toLowerCase()}`;
    }

    updateScore(score) {
        this.scoreDisplay.innerText = String(score).padStart(5, '0');
    }

    updateHiScore(hiScore) {
        this.hiScoreDisplay.innerText = String(hiScore).padStart(5, '0');
    }

    showStartScreen() {
        this.startScreen.classList.remove('hidden');
        this.gameOverScreen.classList.add('hidden');
    }

    showGameOverScreen() {
        this.gameOverScreen.classList.remove('hidden');
    }

    hideScreens() {
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
    }

    hideLoadingCam() {
        this.loadingCam.style.display = 'none';
    }

    onStartBtnClick(callback) {
        this.startBtn.addEventListener('click', callback);
    }
}
