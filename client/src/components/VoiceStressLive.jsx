import React, { useEffect, useRef } from 'react';

function VoiceStressLive({ onVoiceStress }) {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const bufferRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      const buffer = new Float32Array(analyser.fftSize);

      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      bufferRef.current = buffer;

      analyzePitch();
    };

    const analyzePitch = () => {
      const detect = () => {
        const analyser = analyserRef.current;
        const buffer = bufferRef.current;
        analyser.getFloatTimeDomainData(buffer);

        // Estimate "energy" as a proxy for stress
        const energy = buffer.reduce((sum, val) => sum + val * val, 0) / buffer.length;
        const stressScore = Math.min(1, energy * 100); // simple normalization

        if (onVoiceStress) {
          onVoiceStress(stressScore);
        }

        requestAnimationFrame(detect);
      };

      detect();
    };

    init();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [onVoiceStress]);

  return (
    <div className="bg-white p-4 rounded shadow mt-4">
      <h3 className="text-lg font-bold">🎤 Voice Stress Analyzer (Live)</h3>
      <p className="text-sm text-gray-500">Analyzing your voice stress in real time...</p>
    </div>
  );
}

export default VoiceStressLive;
