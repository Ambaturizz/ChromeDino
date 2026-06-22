/**
 * SoundManager.js
 * Synthesises all in-game sound effects using the Web Audio API.
 * No external audio files are needed.
 */
export class SoundManager {
    constructor() {
        this._ctx = null;
    }

    /** Lazily create AudioContext on first call (satisfies autoplay policies). */
    _getCtx() {
        if (!this._ctx) {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this._ctx.state === 'suspended') this._ctx.resume();
        return this._ctx;
    }

    _play(type, freqStart, freqEnd, duration, gainVal, waveType = 'sine') {
        try {
            const ctx  = this._getCtx();
            const now  = ctx.currentTime;
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = waveType;
            osc.frequency.setValueAtTime(freqStart, now);
            osc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration);

            gain.gain.setValueAtTime(gainVal, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + duration);
        } catch (_) {}
    }

    playJump()  { this._play('jump',  280, 560,  0.25, 0.25, 'sine');     }
    playCrash() { this._play('crash', 180,  40,  0.4,  0.5,  'sawtooth'); }
    playScore() { this._play('score', 660, 1320, 0.15, 0.12, 'square');   }
    playDuck()  { this._play('duck',  400, 200,  0.15, 0.15, 'triangle'); }
}
