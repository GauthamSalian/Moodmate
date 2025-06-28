import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = (props) => (
  <div className="w-64 h-screen bg-blue-900 text-white p-4 space-y-4">
    <h1 className="text-2xl font-bold mb-6">🧠 MoodMate</h1>
    <nav className="space-y-2">
      <Link to="/chatbot" className="block hover:underline">💬 Chatbot</Link>
      <Link to="/dashboard" className="block hover:underline">📊 Stress Dashboard</Link>
      <Link to="/inputs" className="block hover:underline">🎛 Input Monitor</Link>
      <Link to="/logs" className="block hover:underline">📁 Chat Logs</Link>
      <Link to="/book" className="block hover:underline">🩺 Book a Session</Link>
    </nav>
  </div>
);

export default Sidebar;
