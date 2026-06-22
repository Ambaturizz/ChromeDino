/**
 * UIManager.js
 * Centralises all DOM interactions. No other module should
 * touch the DOM directly.
 */
export class UIManager {
    constructor() {
        // HUD elements
        this.poseStatusEl  = document.getElementById('poseStatus');
        this.scoreDisplay  = document.getElementById('scoreDisplay');
        this.hiScoreDisplay = document.getElementById('hiScoreDisplay');
        this.weatherLabel  = document.getElementById('weatherLabel');

        // Overlay screens
        this.startScreen   = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.loadingCam    = document.getElementById('loadingCam');
        this.calibrationUI = document.getElementById('calibrationUI');
        this.progressBar   = document.getElementById('calibrationProgress');

        // Stat elements in game over screen
        this.statIds = ['statScore','statHiScore','statJumps','statSquats','statTime','statCalories'];

        // Start button
        this.startBtn = document.getElementById('startBtn');
    }

    // ── HUD ──────────────────────────────────────────────────────────────────

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

    updateWeather(weather) {
        const icons = { clear: '☀️', rain: '🌧️', fog: '🌫️', storm: '⛈️' };
        if (this.weatherLabel) {
            this.weatherLabel.innerText = `${icons[weather] || ''} ${weather.toUpperCase()}`;
        }
    }

    // ── Screens ──────────────────────────────────────────────────────────────

    showStartScreen() {
        this.startScreen.classList.remove('hidden');
        this.gameOverScreen.classList.add('hidden');
    }

    showDashboard(stats) {
        const vals = {
            statScore   : stats.score,
            statHiScore : stats.hiScore,
            statJumps   : stats.jumps,
            statSquats  : stats.squats,
            statTime    : stats.duration,
            statCalories: `${stats.calories} kcal`,
        };
        for (const [id, val] of Object.entries(vals)) {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        }
        // Animate stat boxes in
        const boxes = document.querySelectorAll('.stat-box');
        boxes.forEach((box, i) => {
            box.style.opacity   = '0';
            box.style.transform = 'translateY(20px)';
            setTimeout(() => {
                box.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                box.style.opacity    = '1';
                box.style.transform  = 'translateY(0)';
            }, 800 + i * 80);
        });

        setTimeout(() => this.gameOverScreen.classList.remove('hidden'), 700);
    }

    hideScreens() {
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
    }

    // ── Camera / Calibration ─────────────────────────────────────────────────

    hideLoadingCam() { this.loadingCam.classList.add('hidden'); }

    showCalibrationUI()  { this.calibrationUI.classList.remove('hidden'); }
    hideCalibrationUI()  { this.calibrationUI.classList.add('hidden'); }

    updateCalibrationProgress(pct) {
        this.progressBar.style.width = `${pct}%`;
    }

    // ── Event binding ─────────────────────────────────────────────────────────

    onStartBtnClick(cb) { this.startBtn.addEventListener('click', cb); }
}
