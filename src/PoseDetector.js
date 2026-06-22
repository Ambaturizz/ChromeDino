export class PoseDetector {
    constructor(uiManager, onPoseUpdate) {
        this.ui = uiManager;
        this.onPoseUpdate = onPoseUpdate; 
        
        this.videoElement = document.getElementById('input_video');
        this.canvasElement = document.getElementById('output_canvas');
        this.canvasCtx = this.canvasElement.getContext('2d');
        
        this.baselineY = null;
        this.poseStatus = 'STANDING';
        this.smoothedY = null;
        
        this.alpha = 0.4; 
        
        this.jumpThreshold = -0.04; 
        this.crouchThreshold = 0.06;
        
        this.isCalibrated = false;
        this.calibrationFrames = 0;
        this.requiredCalibrationFrames = 60; // ~2 seconds of standing still
        
        this.init();
    }

    init() {
        const pose = new Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });

        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        pose.onResults(this.onResults.bind(this));

        const camera = new Camera(this.videoElement, {
            onFrame: async () => {
                await pose.send({image: this.videoElement});
            },
            width: 640,
            height: 480
        });
        
        camera.start().then(() => {
            this.ui.hideLoadingCam();
            this.ui.showCalibrationUI();
        });
    }

    onResults(results) {
        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        
        // Transparent webcam: Draw image with opacity
        this.canvasCtx.globalAlpha = 0.2;
        this.canvasCtx.drawImage(
            results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
        this.canvasCtx.globalAlpha = 1.0;
            
        if (results.poseLandmarks) {
            drawConnectors(this.canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
                           {color: '#0ea5e9', lineWidth: 2});
            drawLandmarks(this.canvasCtx, results.poseLandmarks,
                          {color: '#ffffff', lineWidth: 1, radius: 2});
                          
            this.detectPose(results.poseLandmarks);
        }
        this.canvasCtx.restore();
    }

    detectPose(landmarks) {
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        
        let targetY = null;

        if (leftHip.visibility > 0.5 && rightHip.visibility > 0.5) {
            targetY = (leftHip.y + rightHip.y) / 2;
        } else if (leftShoulder.visibility > 0.5 && rightShoulder.visibility > 0.5) {
            targetY = (leftShoulder.y + rightShoulder.y) / 2;
        } else {
            return; 
        }

        if (this.smoothedY === null) {
            this.smoothedY = targetY;
        } else {
            this.smoothedY = (this.alpha * targetY) + ((1 - this.alpha) * this.smoothedY);
        }
        
        if (!this.isCalibrated) {
            this.calibrationFrames++;
            let progress = Math.min(100, (this.calibrationFrames / this.requiredCalibrationFrames) * 100);
            this.ui.updateCalibrationProgress(progress);
            
            if(this.calibrationFrames >= this.requiredCalibrationFrames) {
                this.isCalibrated = true;
                this.baselineY = this.smoothedY;
                this.ui.hideCalibrationUI();
                this.ui.showStartScreen(); // Show start btn only after calibration
            }
            return;
        }

        if (this.baselineY === null) {
            this.baselineY = this.smoothedY;
        } else {
            if (this.poseStatus === 'STANDING') {
                this.baselineY = this.baselineY * 0.95 + this.smoothedY * 0.05;
            }
        }
        
        const dy = this.smoothedY - this.baselineY;
        
        let newStatus = 'STANDING';
        if (dy < this.jumpThreshold) {
            newStatus = 'JUMPING';
        } else if (dy > this.crouchThreshold) {
            newStatus = 'CROUCHING';
        }
        
        if (newStatus !== this.poseStatus) {
            this.poseStatus = newStatus;
            this.onPoseUpdate(this.poseStatus);
        }
    }
    
    resetBaseline() {
        this.baselineY = null;
        this.smoothedY = null;
    }
}
