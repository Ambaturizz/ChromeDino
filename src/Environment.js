/**
 * Environment.js
 * Handles all visual backgrounds: day/night cycle and random weather effects.
 * Rendered on the game canvas before all game objects.
 */
export class Environment {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {CanvasRenderingContext2D} ctx
     */
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        // ── Day/Night Cycle ──────────────────────────────────────────────────
        this.DAY_DURATION   = 30 * 60; // frames (~30 s at 60 fps)
        this.NIGHT_DURATION = 20 * 60; // frames (~20 s)
        this.cycleFrame     = 0;
        this.isDay          = true;

        // ── Stars (visible at night) ─────────────────────────────────────────
        this.stars = Array.from({ length: 80 }, () => ({
            x      : Math.random() * 2000,
            y      : Math.random() * 300,
            size   : Math.random() * 2 + 0.5,
            opacity: Math.random()
        }));

        // ── Ground scanlines (parallax layers) ───────────────────────────────
        this.groundLayers = [
            { y: 0.78, color: null, speed: 1.0 },
            { y: 0.88, color: null, speed: 1.5 },
        ];

        // ── Weather ──────────────────────────────────────────────────────────
        this.WEATHER_TYPES = ['clear', 'rain', 'fog', 'storm'];
        this.currentWeather = 'clear';
        this.weatherTimer   = 0;
        this.WEATHER_DURATION = 60 * 60; // frames (~60 s)

        // Rain drops pool
        this.rainDrops = Array.from({ length: 200 }, () => this._newRainDrop());
        // Lightning flash
        this.lightningAlpha = 0;
        this.lightningTimer = 0;

        // Fog opacity
        this.fogAlpha = 0;
        this.targetFogAlpha = 0;

        this._scheduleWeatherChange();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────
    _newRainDrop() {
        return {
            x  : Math.random() * 2000,
            y  : Math.random() * -600,
            vy : 14 + Math.random() * 6,
            vx : -2,
            len: 18 + Math.random() * 12,
        };
    }

    _scheduleWeatherChange() {
        this.weatherTimer = this.WEATHER_DURATION + Math.random() * 1200;
    }

    _setWeather(type) {
        this.currentWeather = type;
        this.targetFogAlpha = (type === 'fog' || type === 'storm') ? 0.25 : 0;
        if (type === 'storm') this.lightningTimer = 200 + Math.floor(Math.random() * 300);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    /** Call once per frame BEFORE drawing game objects. */
    update(gameSpeed) {
        // Day/Night cycle
        const cyclePeriod = this.DAY_DURATION + this.NIGHT_DURATION;
        this.cycleFrame = (this.cycleFrame + 1) % cyclePeriod;
        this.isDay = this.cycleFrame < this.DAY_DURATION;

        // Weather rotation
        this.weatherTimer--;
        if (this.weatherTimer <= 0) {
            const options = this.WEATHER_TYPES.filter(w => w !== this.currentWeather);
            this._setWeather(options[Math.floor(Math.random() * options.length)]);
            this._scheduleWeatherChange();
        }

        // Rain physics
        if (this.currentWeather === 'rain' || this.currentWeather === 'storm') {
            for (const d of this.rainDrops) {
                d.y += d.vy;
                d.x += d.vx;
                if (d.y > this.canvas.height) Object.assign(d, this._newRainDrop());
            }
        }

        // Lightning
        if (this.currentWeather === 'storm') {
            this.lightningTimer--;
            if (this.lightningTimer <= 0) {
                this.lightningAlpha = 0.7;
                this.lightningTimer = 200 + Math.floor(Math.random() * 400);
            }
            if (this.lightningAlpha > 0) this.lightningAlpha -= 0.05;
        } else {
            this.lightningAlpha = 0;
        }

        // Fog lerp
        this.fogAlpha += (this.targetFogAlpha - this.fogAlpha) * 0.01;
    }

    /** Render full background, sky, stars, weather. */
    draw(frame, gameSpeed) {
        const { canvas: cv, ctx } = this;
        const W = cv.width, H = cv.height;

        // ── Sky gradient ──────────────────────────────────────────────────────
        const t          = this.cycleFrame / (this.DAY_DURATION + this.NIGHT_DURATION);
        const skyColors  = this.isDay
            ? this._daySkyColors(this.cycleFrame / this.DAY_DURATION)
            : this._nightSkyColors((this.cycleFrame - this.DAY_DURATION) / this.NIGHT_DURATION);
        const skyGrad    = ctx.createLinearGradient(0, 0, 0, H * 0.8);
        skyGrad.addColorStop(0, skyColors[0]);
        skyGrad.addColorStop(1, skyColors[1]);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H);

        // ── Stars (night only) ────────────────────────────────────────────────
        if (!this.isDay) {
            const nightProgress = (this.cycleFrame - this.DAY_DURATION) / this.NIGHT_DURATION;
            const starFade      = Math.min(1, nightProgress * 5);
            for (const s of this.stars) {
                s.x -= gameSpeed * 0.08;
                if (s.x < 0) s.x = W + Math.random() * 200;
                ctx.globalAlpha = s.opacity * starFade * 0.9;
                ctx.fillStyle   = '#ffffff';
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        // ── Sun / Moon ────────────────────────────────────────────────────────
        this._drawCelestialBody(ctx, W, H);

        // ── Rain ──────────────────────────────────────────────────────────────
        if (this.currentWeather === 'rain' || this.currentWeather === 'storm') {
            ctx.strokeStyle = 'rgba(174, 214, 241, 0.6)';
            ctx.lineWidth   = 1;
            ctx.beginPath();
            for (const d of this.rainDrops) {
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x + d.vx * 3, d.y + d.len);
            }
            ctx.stroke();
        }

        // ── Lightning flash ───────────────────────────────────────────────────
        if (this.lightningAlpha > 0) {
            ctx.fillStyle   = `rgba(255,255,220,${this.lightningAlpha})`;
            ctx.fillRect(0, 0, W, H);
        }

        // ── Fog overlay ───────────────────────────────────────────────────────
        if (this.fogAlpha > 0.01) {
            const fogColor  = this.isDay ? 'rgba(220,220,220,' : 'rgba(40,40,60,';
            const fogGrad   = ctx.createLinearGradient(0, 0, 0, H * 0.8);
            fogGrad.addColorStop(0, `${fogColor}0)`);
            fogGrad.addColorStop(1, `${fogColor}${this.fogAlpha.toFixed(2)})`);
            ctx.fillStyle = fogGrad;
            ctx.fillRect(0, 0, W, H);
        }
    }

    // Ground strip — drawn AFTER game objects so it feels like a floor
    drawGround(groundY) {
        const { canvas: cv, ctx } = this;
        const W = cv.width;

        // Ground glow strip
        const gColor = this.isDay ? '#0ea5e9' : '#818cf8';
        const gGrad  = ctx.createLinearGradient(0, groundY - 2, 0, groundY + 20);
        gGrad.addColorStop(0, gColor);
        gGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = gGrad;
        ctx.fillRect(0, groundY - 2, W, 22);

        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(W, groundY);
        ctx.strokeStyle = gColor;
        ctx.lineWidth   = 3;
        ctx.shadowBlur  = 12;
        ctx.shadowColor = gColor;
        ctx.stroke();
        ctx.shadowBlur  = 0;
    }

    // ── Private sky helpers ───────────────────────────────────────────────────
    _daySkyColors(progress) {
        // 0=dawn, 0.5=noon, 1=dusk
        if (progress < 0.15) return ['#ff7043', '#ffb74d'];
        if (progress > 0.85) return ['#ff5722', '#ff8a65'];
        return ['#0ea5e9', '#bae6fd'];
    }

    _nightSkyColors(progress) {
        if (progress < 0.1) return ['#1e3a5f', '#374151'];
        return ['#030712', '#0f172a'];
    }

    _drawCelestialBody(ctx, W, H) {
        const PERIOD  = this.DAY_DURATION + this.NIGHT_DURATION;
        const angle   = (this.cycleFrame / PERIOD) * Math.PI;          // 0 → π
        const bodyX   = W * 0.85;
        const bodyY   = H * 0.18 + Math.sin(angle * 2) * H * 0.08;

        if (this.isDay) {
            // Sun glow
            ctx.shadowBlur  = 40;
            ctx.shadowColor = '#fbbf24';
            ctx.fillStyle   = '#fde68a';
            ctx.beginPath();
            ctx.arc(bodyX, bodyY, 28, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fef3c7';
            ctx.beginPath();
            ctx.arc(bodyX, bodyY, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            // Moon
            ctx.shadowBlur  = 20;
            ctx.shadowColor = '#e2e8f0';
            ctx.fillStyle   = '#e2e8f0';
            ctx.beginPath();
            ctx.arc(bodyX, bodyY, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = this.isDay ? '#bae6fd' : '#0f172a';
            ctx.beginPath();
            ctx.arc(bodyX + 8, bodyY - 6, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}
