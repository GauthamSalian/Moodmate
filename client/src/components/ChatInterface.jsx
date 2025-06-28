import React, { useState } from 'react';
import { sendChatToFastAPI } from '../utils/chatAPI';

function ChatInterface({ voiceStressScore, onTypingStressUpdate, ...props }) {
  const [message, setMessage] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [charCount, setCharCount] = useState(0);
  const [chat, setChat] = useState([]);

  const handleChange = (e) => {
    const val = e.target.value;

    if (!startTime) setStartTime(Date.now());
    setCharCount(val.length);

    // Live stress score based on typing speed
    const duration = (Date.now() - startTime) / 1000; // seconds
    const speed = charCount / (duration || 1); // chars/sec
    const stress = Math.max(0, Math.min(1, 1 - (speed / 10))); // normalize 0-1

    if (onTypingStressUpdate) onTypingStressUpdate(stress);
    setMessage(val);
  };

  const sendMessage = async (userMessage) => {
    const payload = {
      message: userMessage,
      stress_context: {
        voice: voiceStressScore,
        // You can also add: face, typing, etc.
      }
    };

    const res = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    setChat(prev => [
      ...prev,
      { sender: "user", text: userMessage },
      { sender: "bot", text: data.reply }
    ]);
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMsg = { from: 'user', text: message };
    setChat(prev => [...prev, userMsg]);

    const res = await sendChatToFastAPI(message);
    const botMsg = { from: 'bot', text: res.response };
    setChat(prev => [...prev, botMsg]);

    setMessage('');
    setStartTime(null);
    setCharCount(0);
  };

  return (
    <div className="my-4">
      <div className="mb-2">
        {chat.map((entry, idx) => (
          <div key={idx} className={entry.sender === "user" ? "text-right" : "text-left"}>
            <span className={entry.sender === "user" ? "font-semibold text-blue-700" : "font-semibold text-green-700"}>
              {entry.sender === "user" ? "You" : "MoodMate"}:
            </span> {entry.text}
          </div>
        ))}
      </div>
      <textarea
        value={message}
        onChange={handleChange}
        placeholder="Talk to MoodMate..."
        rows={2}
        className="w-full p-2 border rounded"
      />
      <button
        onClick={handleSend}
        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Send
      </button>
    </div>
  );
}

export default ChatInterface;
