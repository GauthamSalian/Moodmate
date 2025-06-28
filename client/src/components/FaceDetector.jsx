import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import './FaceDetector.css';

const emotionToStress = {
  happy: 0.1,
  neutral: 0.3,
  surprised: 0.4,
  fearful: 0.7,
  disgusted: 0.8,
  sad: 0.9,
  angry: 1.0
};

function FaceDetector({ onEmotionDetected }) {
  const webcamRef = useRef(null);
  const [emotion, setEmotion] = useState("Detecting...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'; // public/models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      setLoading(false);
    };

    loadModels();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (
        webcamRef.current &&
        webcamRef.current.video.readyState === 4 &&
        !loading
      ) {
        const detections = await faceapi
          .detectSingleFace(
            webcamRef.current.video,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceExpressions();

        if (detections && detections.expressions) {
          const expressions = detections.expressions;
          const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
          const topEmotion = sorted[0][0];
          setEmotion(topEmotion);

          const stressScore = emotionToStress[topEmotion] || 0.5;
          if (onEmotionDetected) {
            onEmotionDetected({ emotion: topEmotion, stress: stressScore });
          }
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [loading]);

  return (
    <div className="face-detector">
      <h2>🧠 Face Emotion Detector</h2>
      <Webcam
        ref={webcamRef}
        audio={false}
        width={320}
        height={240}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: 'user' }}
      />
      <p>Detected Emotion: <strong>{emotion}</strong></p>
    </div>
  );
}

export default FaceDetector;
