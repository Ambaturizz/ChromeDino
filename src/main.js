import { UIManager } from './UIManager.js';
import { ScoreManager } from './ScoreManager.js';
import { PoseDetector } from './PoseDetector.js';
import { GameEngine } from './GameEngine.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Managers
    const ui = new UIManager();
    const score = new ScoreManager(ui);
    const game = new GameEngine('gameCanvas', ui, score);
    
    // Hide start screen initially until calibration is done
    document.getElementById('startScreen').classList.add('hidden');
    
    const startGame = () => {
        ui.hideScreens();
        game.start();
        detector.resetBaseline(); // Reset baseline on start
    };
    
    // Bind UI actions
    ui.onStartBtnClick(startGame);
    
    game.onGameOver = (stats) => {
        ui.showDashboard(stats);
    };
    
    // Initialize Pose Detection
    const detector = new PoseDetector(ui, (status) => {
        ui.updatePoseStatus(status);
        
        // Handle Game Input based on Pose
        if (status === 'JUMPING') {
            if (game.state === 'PLAYING') {
                game.handleInput('JUMP');
            } else if (game.state === 'START' || game.state === 'GAME_OVER') {
                // If calibration is done, jump can start/restart
                if(detector.isCalibrated) startGame();
            }
        }
        
        if (status === 'CROUCHING') {
            if (game.state === 'PLAYING') {
                game.handleInput('CROUCH_ON');
            }
        } else {
            // STANDING or JUMPING means not crouching
            if (game.state === 'PLAYING') {
                game.handleInput('CROUCH_OFF');
            }
        }
    });

    // Keyboard fallback for testing/debugging
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            if (game.state === 'PLAYING') {
                game.handleInput('JUMP');
            } else {
                if(detector.isCalibrated) startGame();
            }
        } else if (e.code === 'ArrowDown') {
            if (game.state === 'PLAYING') {
                game.handleInput('CROUCH_ON');
            }
        }
    });
    
    window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowDown') {
            if (game.state === 'PLAYING') {
                game.handleInput('CROUCH_OFF');
            }
        }
    });
    
    // Initial draw
    game.draw();
});
