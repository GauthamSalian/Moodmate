import React from 'react';
import ChatInterface from './ChatInterface';
import VoiceInput from './VoiceInput';
import VoiceStressLive from './VoiceStressLive';

const ChatbotPage = ({ fusionInputs, setFusionInputs }) => (
  <div className="space-y-4">
    <h2 className="text-xl font-bold">💬 Chatbot Support</h2>
    <VoiceInput onVoiceCaptured={val => setFusionInputs(prev => ({ ...prev, voice: val }))} />
    <VoiceStressLive onStressCalculated={val => setFusionInputs(prev => ({ ...prev, voice: val }))} />
    <ChatInterface fusionInputs={fusionInputs} />
  </div>
);

export default ChatbotPage;