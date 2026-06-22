export class GameEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Responsive canvas
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    this.state = 'START'; // START, PLAYING, GAME_OVER
    this.score = 0;
    this.hiScore = localStorage.getItem('dinoHiScore') || 0;
    this.gameSpeed = 6;
    this.gravity = 0.6;
    
    this.dino = {
      x: 50,
      y: 0,
      width: 44,
      height: 44,
      vy: 0,
      isJumping: false,
      isCrouching: false,
      groundY: 0
    };
    
    this.obstacles = [];
    this.frame = 0;
    this.animationId = null;
    
    // Callbacks for UI updates
    this.onScoreUpdate = null;
    this.onGameOver = null;
    
    this.updateHiScore(this.hiScore);
  }

  resize() {
    // Match canvas to actual CSS dimensions
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    
    // Set ground level
    this.dino.groundY = this.canvas.height - 100;
    
    // If not playing, keep dino on ground
    if (!this.dino.isJumping) {
      this.dino.y = this.dino.groundY - this.dino.height;
    }
  }

  start() {
    this.state = 'PLAYING';
    this.score = 0;
    this.gameSpeed = 6;
    this.obstacles = [];
    this.frame = 0;
    
    this.dino.y = this.dino.groundY - this.dino.height;
    this.dino.vy = 0;
    this.dino.isJumping = false;
    this.dino.isCrouching = false;
    
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.loop();
  }

  jump() {
    if (this.state !== 'PLAYING') return;
    if (!this.dino.isJumping) {
      this.dino.vy = -12;
      this.dino.isJumping = true;
    }
  }

  crouch(isCrouching) {
    if (this.state !== 'PLAYING') return;
    this.dino.isCrouching = isCrouching;
    
    if (isCrouching && !this.dino.isJumping) {
      this.dino.height = 22;
      this.dino.width = 60;
      this.dino.y = this.dino.groundY - this.dino.height;
    } else if (!isCrouching && !this.dino.isJumping) {
      this.dino.height = 44;
      this.dino.width = 44;
      this.dino.y = this.dino.groundY - this.dino.height;
    } else if (!isCrouching && this.dino.isJumping) {
      this.dino.height = 44;
      this.dino.width = 44;
    }
  }

  update() {
    // Dino Physics
    this.dino.vy += this.gravity;
    
    // Fast fall if crouching while jumping
    if (this.dino.isCrouching && this.dino.isJumping) {
       this.dino.vy += this.gravity * 2; 
    }
    
    this.dino.y += this.dino.vy;

    // Ground Collision
    if (this.dino.y + this.dino.height >= this.dino.groundY) {
      this.dino.y = this.dino.groundY - this.dino.height;
      this.dino.vy = 0;
      this.dino.isJumping = false;
    }

    // Spawn Obstacles
    if (this.frame % 80 === 0 && this.frame > 0) {
      let spawnChance = Math.random();
      if (spawnChance > 0.3) {
        let type = Math.random() > 0.5 ? 'small' : 'large';
        let width = type === 'small' ? 20 : 30;
        let height = type === 'small' ? 40 : 60;
        
        let isFlying = Math.random() > 0.8 && this.score > 200;
        let yPos = this.dino.groundY - height;
        
        if (isFlying) {
           yPos -= Math.random() > 0.5 ? 25 : 60; // Low or high flying
           width = 40;
           height = 30;
           type = 'flying';
        }
        
        this.obstacles.push({
          x: this.canvas.width,
          y: yPos,
          width: width,
          height: height,
          type: type
        });
      }
    }

    // Move & Remove Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      let obs = this.obstacles[i];
      obs.x -= this.gameSpeed;

      if (obs.x + obs.width < 0) {
        this.obstacles.splice(i, 1);
      }
    }

    // Collision Detection
    for (let obs of this.obstacles) {
      if (
        this.dino.x < obs.x + obs.width &&
        this.dino.x + this.dino.width > obs.x &&
        this.dino.y < obs.y + obs.height &&
        this.dino.y + this.dino.height > obs.y
      ) {
        const padding = 5;
        if (
            this.dino.x + padding < obs.x + obs.width - padding &&
            this.dino.x + this.dino.width - padding > obs.x + padding &&
            this.dino.y + padding < obs.y + obs.height - padding &&
            this.dino.y + this.dino.height - padding > obs.y + padding
        ) {
           this.gameOver();
        }
      }
    }

    // Score & Speed
    this.frame++;
    if (this.frame % 5 === 0) {
      this.score++;
      if (this.onScoreUpdate) this.onScoreUpdate(this.score);
      
      if (this.score % 100 === 0) {
        this.gameSpeed += 0.5; // Increase difficulty
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Ground Line
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.dino.groundY);
    this.ctx.lineTo(this.canvas.width, this.dino.groundY);
    this.ctx.strokeStyle = '#334155';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Draw Dino
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#38bdf8';
    this.ctx.fillStyle = '#38bdf8';
    
    // Give dino rounded corners for a modern look
    this.ctx.beginPath();
    this.ctx.roundRect(this.dino.x, this.dino.y, this.dino.width, this.dino.height, 8);
    this.ctx.fill();
    this.ctx.shadowBlur = 0; // Reset

    // Draw Obstacles
    for (let obs of this.obstacles) {
      if (obs.type === 'flying') {
          this.ctx.shadowColor = '#8b5cf6';
          this.ctx.fillStyle = '#8b5cf6';
      } else {
          this.ctx.shadowColor = '#f43f5e';
          this.ctx.fillStyle = '#f43f5e';
      }
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 4);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
  }

  loop() {
    if (this.state === 'PLAYING') {
      this.update();
      this.draw();
      this.animationId = requestAnimationFrame(() => this.loop());
    }
  }

  gameOver() {
    this.state = 'GAME_OVER';
    if (this.score > this.hiScore) {
      this.hiScore = this.score;
      localStorage.setItem('dinoHiScore', this.hiScore);
      this.updateHiScore(this.hiScore);
    }
    if (this.onGameOver) this.onGameOver();
  }

  updateHiScore(score) {
    const hsDisplay = document.getElementById('hiScoreDisplay');
    if (hsDisplay) {
        hsDisplay.innerText = String(score).padStart(5, '0');
    }
  }
}
