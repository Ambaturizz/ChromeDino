export class PoseDetector {
  constructor(onPoseUpdate) {
    this.onPoseUpdate = onPoseUpdate; // Callback to send 'STANDING', 'JUMPING', 'CROUCHING'
    this.videoElement = document.getElementById('input_video');
    this.canvasElement = document.getElementById('output_canvas');
    this.canvasCtx = this.canvasElement.getContext('2d');
    
    this.baselineY = null;
    this.poseStatus = 'STANDING'; // 'STANDING', 'JUMPING', 'CROUCHING'
    
    // Thresholds (relative coordinates 0.0 - 1.0)
    // Decreasing Y means moving UP in camera frame (jumping)
    // Increasing Y means moving DOWN in camera frame (crouching)
    this.jumpThreshold = -0.04; // 4% of screen height up from baseline
    this.crouchThreshold = 0.06; // 6% of screen height down from baseline
    
    this.init();
  }

  init() {
    const pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
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
      document.getElementById('loadingCam').style.display = 'none';
    });
  }

  onResults(results) {
    // Draw landmarks
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    this.canvasCtx.drawImage(
        results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
        
    if (results.poseLandmarks) {
      drawConnectors(this.canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
                     {color: '#00FF00', lineWidth: 4});
      drawLandmarks(this.canvasCtx, results.poseLandmarks,
                    {color: '#FF0000', lineWidth: 2});
                    
      this.detectPose(results.poseLandmarks);
    }
    this.canvasCtx.restore();
  }

  detectPose(landmarks) {
    // Get average Y of shoulders (landmarks 11 and 12)
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    
    // If shoulders aren't visible enough, skip
    if (leftShoulder.visibility < 0.5 || rightShoulder.visibility < 0.5) return;
    
    const currentY = (leftShoulder.y + rightShoulder.y) / 2;
    
    // Set baseline smoothly if not jumping/crouching, or set it instantly at start
    if (this.baselineY === null) {
      this.baselineY = currentY;
    } else {
      // Slowly adapt baseline to handle camera shifts or player moving closer/further
      if (this.poseStatus === 'STANDING') {
        this.baselineY = this.baselineY * 0.95 + currentY * 0.05;
      }
    }
    
    const dy = currentY - this.baselineY;
    
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
  }
}
