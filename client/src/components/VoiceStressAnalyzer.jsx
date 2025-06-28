import React, { useEffect } from 'react';

const VoiceStressAnalyzer = ({ onVoiceStressUpdate }) => {
  useEffect(() => {
    let audioContext, analyser, mic, intervalId;

    const processAudio = () => {
      const bufferLength = analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      // Basic volume-based stress mapping
      const avg = dataArray.reduce((sum, val) => sum + Math.abs(val - 128), 0) / bufferLength;
      const normalized = Math.min(1, avg / 50); // ~0.2-0.8 range
      onVoiceStressUpdate(normalized);
    };

    const initAudio = async () => {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mic = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        mic.connect(analyser);

        intervalId = setInterval(processAudio, 2000); // Every 2s
      } catch (error) {
        console.error("Voice access failed:", error);
      }
    };

    initAudio();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (audioContext) audioContext.close();
    };
  }, [onVoiceStressUpdate]);

  return (
    <div className="mb-4">
      <label className="block mb-1 font-semibold">🎤 Voice Monitoring Enabled</label>
      <p className="text-sm text-gray-600">Voice emotion is being analyzed in real time...</p>
    </div>
  );
};

export default VoiceStressAnalyzer;
