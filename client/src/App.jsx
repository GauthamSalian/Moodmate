import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ChatbotPage from './components/ChatbotPage';
import StressDashboard from './components/StressDashboard';
import InputMonitor from './components/InputMonitor';
import Logs from './components/Logs';
import TwitterAnalyzer from './components/TwitterAnalyzer';
import ChatInterface from './components/ChatInterface';
import BookingPage from './pages/BookingPage';

function App() {
  const [fusionInputs, setFusionInputs] = useState({
    face: null,
    voice: null,
    text: null,
    typing: null
  });

  const handleVoiceInput = (stress) => {
    console.log("🎤 Voice Stress →", stress);
    setFusionInputs(prev => ({ ...prev, voice: stress }));
  };

  return (
    <Router>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-6">
          {/* <VoiceStressLive
            onVoiceStress={(score) => {
              console.log("🎙️ Voice Stress Score:", score);
              setFusionInputs(prev => ({ ...prev, voice: score }));
            }}
          /> */}
          <ChatInterface voiceStressScore={fusionInputs.voice} />
          {/* Other inputs/components can go here */}
          <Routes>
            <Route path="/chat" element={<ChatInterface />} />
            <Route path="/chatbot" element={<ChatbotPage fusionInputs={fusionInputs} setFusionInputs={setFusionInputs} />} />
            <Route path="/dashboard" element={<StressDashboard fusionInputs={fusionInputs} />} />
            <Route path="/inputs" element={<InputMonitor setFusionInputs={setFusionInputs} />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/twitter" element={<TwitterAnalyzer />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/" element={<ChatbotPage fusionInputs={fusionInputs} setFusionInputs={setFusionInputs} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
