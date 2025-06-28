import React, { useState } from 'react';

const VoiceInput = ({ onSendMessage }) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      onSendMessage(text);
      setListening(false);
    };

    recognition.onerror = (e) => {
      console.error("Speech recognition error", e);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  return (
    <div className="mb-4">
      <button
        onClick={handleVoiceInput}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        🎙 {listening ? "Listening..." : "Speak to MoodMate"}
      </button>

      {transcript && (
        <p className="mt-2 text-gray-600 italic">🗣 You said: “{transcript}”</p>
      )}
    </div>
  );
};

export default VoiceInput;
