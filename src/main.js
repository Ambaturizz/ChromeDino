import { PoseDetector } from './pose.js';
import { GameEngine } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
    const game = new GameEngine('gameCanvas');
    
    const poseStatusEl = document.getElementById('poseStatus');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const startScreen = document.getElementById('startScreen');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const startBtn = document.getElementById('startBtn');
    
    // Callbacks
    game.onScoreUpdate = (score) => {
        scoreDisplay.innerText = String(score).padStart(5, '0');
    };
    
    game.onGameOver = () => {
        gameOverScreen.classList.remove('hidden');
    };
    
    startBtn.addEventListener('click', () => {
        startGame();
    });

    const startGame = () => {
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        game.start();
        detector.resetBaseline(); // Reset baseline on start
    };
    
    // Initialize Pose Detection
    const detector = new PoseDetector((status) => {
        // Update UI
        poseStatusEl.innerText = status;
        poseStatusEl.className = `status-value ${status.toLowerCase()}`;
        
        // Handle Game Input
        if (status === 'JUMPING') {
            if (game.state === 'PLAYING') {
                game.jump();
            } else if (game.state === 'START' || game.state === 'GAME_OVER') {
                startGame();
            }
        }
        
        if (status === 'CROUCHING') {
            if (game.state === 'PLAYING') {
                game.crouch(true);
            }
        } else {
            // Standing or Jumping means not crouching
            if (game.state === 'PLAYING') {
                game.crouch(false);
            }
        }
    });

    // Keyboard fallback for testing
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            if (game.state === 'PLAYING') {
                game.jump();
            } else {
                startGame();
            }
        } else if (e.code === 'ArrowDown') {
            if (game.state === 'PLAYING') {
                game.crouch(true);
            }
        }
    });
    
    window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowDown') {
            if (game.state === 'PLAYING') {
                game.crouch(false);
            }
        }
    });
    
    // Draw initial empty game state
    game.resize();
    game.draw();
});
