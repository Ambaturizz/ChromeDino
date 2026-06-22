/**
 * main.js — Entry point.
 * Instantiates all modules, wires events, and boots the pose detector.
 */

import { UIManager }    from './UIManager.js';
import { ScoreManager } from './ScoreManager.js';
import { PoseDetector } from './PoseDetector.js';
import { GameEngine }   from './GameEngine.js';

document.addEventListener('DOMContentLoaded', () => {

    // ── 1. Instantiate modules ────────────────────────────────────────────────
    const ui    = new UIManager();
    const score = new ScoreManager(ui);
    const game  = new GameEngine('gameCanvas', ui, score);

    // Hide start screen until calibration completes
    document.getElementById('startScreen').classList.add('hidden');

    // ── 2. Start / restart helper ─────────────────────────────────────────────
    const startGame = () => {
        ui.hideScreens();
        game.start();
        detector.resetBaseline();
    };

    // ── 3. Wire UI buttons ────────────────────────────────────────────────────
    ui.onStartBtnClick(startGame);

    game.onGameOver = (stats) => ui.showDashboard(stats);

    // ── 4. Initialise pose detector ───────────────────────────────────────────
    const detector = new PoseDetector(ui, (status) => {
        ui.updatePoseStatus(status);

        // ── Route pose → game actions ─────────────────────────────────────────
        if (game.state === 'PLAYING') {
            if (status === 'JUMPING')   game.handleInput('JUMP');
            if (status === 'CROUCHING') game.handleInput('CROUCH_ON');
            if (status === 'STANDING')  game.handleInput('CROUCH_OFF');
        } else if (status === 'JUMPING' && detector.isCalibrated) {
            // Jump in any non-playing state → start / restart
            startGame();
        }
    });

    // ── 5. Keyboard fallback (for testing without webcam) ─────────────────────
    window.addEventListener('keydown', (e) => {
        if (e.repeat) return; // ignore held keys

        if (e.code === 'Space' || e.code === 'ArrowUp') {
            game.state === 'PLAYING' ? game.handleInput('JUMP') : startGame();
        }
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            game.handleInput('CROUCH_ON');
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            game.handleInput('CROUCH_OFF');
        }
    });
});
