/**
 * PoseDetector.js
 * Wraps MediaPipe Pose to classify the player's pose into:
 *   'STANDING', 'JUMPING', or 'CROUCHING'
 *
 * Detection is based on the vertical position of the hip midpoint
 * (landmarks 23 & 24), with a fallback to shoulders (11 & 12)
 * when hips are not in frame.
 *
 * Smoothing via Exponential Moving Average (EMA) suppresses noise /
 * jitter so that rapid micro-movements do not trigger false inputs.
 */
export class PoseDetector {
    /**
     * @param {UIManager}  uiManager
     * @param {Function}   onPoseUpdate  - called with 'STANDING'|'JUMPING'|'CROUCHING'
     */
    constructor(uiManager, onPoseUpdate) {
        this.ui           = uiManager;
        this.onPoseUpdate = onPoseUpdate;

        // DOM elements
        this.videoEl  = document.getElementById('input_video');
        this.canvasEl = document.getElementById('output_canvas');
        this.canvasCtx = this.canvasEl.getContext('2d');

        // EMA smoothed Y coordinate of the reference body point
        this.smoothedY    = null;
        this.EMA_ALPHA    = 0.35;   // lower = smoother but more latency

        // Baseline Y (standing position) – updated slowly while STANDING
        this.baselineY    = null;

        // Detection thresholds (normalised canvas coords 0–1)
        this.JUMP_THRESHOLD   = -0.04;  // must move UP  4 % of height
        this.CROUCH_THRESHOLD =  0.06;  // must move DOWN 6 % of height

        // State
        this.poseStatus    = 'STANDING';
        this.isCalibrated  = false;
        this.calibFrames   = 0;
        this.CALIB_FRAMES  = 60; // ~2 s at 30 fps

        this._initMediaPipe();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private: MediaPipe setup
    // ─────────────────────────────────────────────────────────────────────────

    _initMediaPipe() {
        const pose = new Pose({
            locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`
        });

        pose.setOptions({
            modelComplexity        : 1,
            smoothLandmarks        : true,
            enableSegmentation     : false,
            minDetectionConfidence : 0.5,
            minTrackingConfidence  : 0.5,
        });

        pose.onResults(this._onResults.bind(this));

        const cam = new Camera(this.videoEl, {
            onFrame: async () => pose.send({ image: this.videoEl }),
            width : 640,
            height: 480,
        });

        cam.start().then(() => {
            this.ui.hideLoadingCam();
            this.ui.showCalibrationUI();
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private: results handler
    // ─────────────────────────────────────────────────────────────────────────

    _onResults(results) {
        const ctx = this.canvasCtx;
        ctx.save();
        ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);

        // Transparent ghost overlay
        ctx.globalAlpha = 0.18;
        ctx.drawImage(results.image, 0, 0, this.canvasEl.width, this.canvasEl.height);
        ctx.globalAlpha = 1;

        if (results.poseLandmarks) {
            drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS,
                { color: '#0ea5e9', lineWidth: 1.5 });
            drawLandmarks(ctx, results.poseLandmarks,
                { color: '#ffffff', lineWidth: 1, radius: 2 });

            this._classify(results.poseLandmarks);
        }

        ctx.restore();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private: pose classification
    // ─────────────────────────────────────────────────────────────────────────

    _classify(lm) {
        const L_HIP = 23, R_HIP = 24, L_SHO = 11, R_SHO = 12;

        // Choose reference point: hips preferred, shoulders as fallback
        let rawY = null;
        if (lm[L_HIP].visibility > 0.5 && lm[R_HIP].visibility > 0.5) {
            rawY = (lm[L_HIP].y + lm[R_HIP].y) / 2;
        } else if (lm[L_SHO].visibility > 0.5 && lm[R_SHO].visibility > 0.5) {
            rawY = (lm[L_SHO].y + lm[R_SHO].y) / 2;
        } else {
            return; // Not enough visibility
        }

        // EMA smoothing
        this.smoothedY = this.smoothedY === null
            ? rawY
            : this.EMA_ALPHA * rawY + (1 - this.EMA_ALPHA) * this.smoothedY;

        // ── Calibration phase ────────────────────────────────────────────────
        if (!this.isCalibrated) {
            this.calibFrames++;
            this.ui.updateCalibrationProgress(
                Math.min(100, (this.calibFrames / this.CALIB_FRAMES) * 100)
            );
            if (this.calibFrames >= this.CALIB_FRAMES) {
                this.isCalibrated = true;
                this.baselineY    = this.smoothedY;
                this.ui.hideCalibrationUI();
                this.ui.showStartScreen();
            }
            return;
        }

        // ── Adaptive baseline (drift slowly toward STANDING position) ─────
        if (this.poseStatus === 'STANDING') {
            this.baselineY = this.baselineY * 0.96 + this.smoothedY * 0.04;
        }

        const dy = this.smoothedY - this.baselineY;

        let next = 'STANDING';
        if (dy < this.JUMP_THRESHOLD)    next = 'JUMPING';
        else if (dy > this.CROUCH_THRESHOLD) next = 'CROUCHING';

        if (next !== this.poseStatus) {
            this.poseStatus = next;
            this.onPoseUpdate(next);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public
    // ─────────────────────────────────────────────────────────────────────────

    resetBaseline() {
        this.baselineY = null;
        this.smoothedY = null;
    }
}
