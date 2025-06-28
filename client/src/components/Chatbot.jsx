import React, { useState } from 'react';
import './Chatbot.css';

function Chatbot() {
  const [messages, setMessages] = useState([
    { type: 'bot', text: '👋 Hi there! How are you feeling today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { type: 'user', text: input };
    setMessages([...messages, userMessage]);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();
      const botMessage = { type: 'bot', text: data.response };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setMessages(prev => [...prev, { type: 'bot', text: '❌ Error: could not connect.' }]);
    } finally {
      setInput('');
      setLoading(false);
    }
  };

  return (
    <div className="chatbot">
      <h2 className="chat-title">🧘‍♀️ MoodMate Advisor</h2>
      <div className="chat-window">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.type}`}>{msg.text}</div>
        ))}
        {loading && <div className="message bot">...</div>}
      </div>
      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type how you're feeling..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default Chatbot;
