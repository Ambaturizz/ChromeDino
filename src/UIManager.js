export class UIManager {
    constructor() {
        this.poseStatusEl = document.getElementById('poseStatus');
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.hiScoreDisplay = document.getElementById('hiScoreDisplay');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.startBtn = document.getElementById('startBtn');
        this.loadingCam = document.getElementById('loadingCam');
        this.calibrationUI = document.getElementById('calibrationUI');
        this.progressBar = document.getElementById('calibrationProgress');
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

    showDashboard(stats) {
        document.getElementById('statScore').innerText = stats.score;
        document.getElementById('statHiScore').innerText = stats.hiScore;
        document.getElementById('statJumps').innerText = stats.jumps;
        document.getElementById('statSquats').innerText = stats.squats;
        document.getElementById('statTime').innerText = stats.duration;
        document.getElementById('statCalories').innerText = `${stats.calories} kcal`;
        
        setTimeout(() => {
            this.gameOverScreen.classList.remove('hidden');
        }, 800); // delay screen so shake can be seen
    }

    hideScreens() {
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
    }

    hideLoadingCam() {
        this.loadingCam.classList.add('hidden');
    }
    
    showCalibrationUI() {
        this.calibrationUI.classList.remove('hidden');
    }
    
    hideCalibrationUI() {
        this.calibrationUI.classList.add('hidden');
    }
    
    updateCalibrationProgress(percent) {
        this.progressBar.style.width = `${percent}%`;
    }

    onStartBtnClick(callback) {
        this.startBtn.addEventListener('click', callback);
    }
}
