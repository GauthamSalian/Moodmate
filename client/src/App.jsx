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
import GoogleFitAuth from './components/GoogleFitAuth'; // ✅ Correct path
import BreathingCatalog from './components/BreathingCatalog';
import JournalDashboard from './components/JournalDashboard'; 
import './App.css';

function App() {
  const [fusionInputs, setFusionInputs] = useState({
    face: null,
    voice: null,
    text: null,
    typing: null
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  React.useEffect(() => {
    console.log("🌙 Applying dark mode");
    document.documentElement.classList.add("dark");
  }, []);

  const handleVoiceInput = (stress) => {
    console.log("🎤 Voice Stress →", stress);
    setFusionInputs(prev => ({ ...prev, voice: stress }));
  };

  return (
    <Router>
      <div className="flex">
        <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
        <div className={`flex-1 p-6 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'} bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100`}>
          <Routes>
            <Route path="/chat" element={<ChatInterface />} />
            <Route path="/chatbot/*" element={<ChatbotPage fusionInputs={fusionInputs} setFusionInputs={setFusionInputs} />} />
            <Route path="/dashboard" element={<StressDashboard fusionInputs={fusionInputs} />} />
            <Route path="/inputs" element={<InputMonitor setFusionInputs={setFusionInputs} />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/twitter" element={<TwitterAnalyzer />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/" element={<ChatbotPage fusionInputs={fusionInputs} setFusionInputs={setFusionInputs} />} />
            <Route path="/sleep" element={<GoogleFitAuth onDataFetched={(data) => setFusionInputs(prev => ({ ...prev, ...data }))} />} />
            <Route path="/library" element={<BreathingCatalog />} />
            <Route path="/journal" element={<JournalDashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
