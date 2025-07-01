import React, { useState, useRef, useEffect } from "react";
import botAvatar from "../assets/bot-avatar.png"; // Use your bot avatar image
import userAvatar from "../assets/user-avatar.png"; // Use your user avatar image

const API_URL = "http://localhost:8000/chat"; // Adjust if your backend runs elsewhere

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_input: input }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: data.reply || "Sorry, I didn't get that." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error: Could not reach server." },
      ]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[80vh] bg-[#f8f9fa] rounded-lg shadow p-4 max-w-2xl mx-auto">
      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex mb-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.sender === "bot" && (
              <img
                src={botAvatar}
                alt="Bot"
                className="w-8 h-8 rounded-full mr-2 self-end"
              />
            )}
            <div
              className={`relative max-w-[70%] px-4 py-2 rounded-xl shadow-sm ${
                msg.sender === "user"
                  ? "bg-white text-gray-900 border border-gray-200"
                  : "bg-[#f4f8ff] text-gray-900 border-l-4 border-blue-400"
              }`}
            >
              {msg.text}
              {/* Copy icon (optional) */}
              <button
                className="absolute bottom-1 right-1 text-gray-400 hover:text-gray-600"
                title="Copy"
                onClick={() => navigator.clipboard.writeText(msg.text)}
                style={{ fontSize: 14 }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeWidth="2" d="M8 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2"/>
                  <rect width="12" height="14" x="4" y="8" rx="2" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            </div>
            {msg.sender === "user" && (
              <img
                src={userAvatar}
                alt="You"
                className="w-8 h-8 rounded-full ml-2 self-end"
              />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {/* Input area */}
      <form
        className="flex items-center gap-2 border-t pt-3 bg-white rounded-b-lg"
        onSubmit={e => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <textarea
          className="flex-1 resize-none border-none outline-none p-2 bg-transparent"
          rows={1}
          placeholder="Type a new message here"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          type="button"
          className="p-2 hover:bg-gray-100 rounded"
          title="Attach"
          tabIndex={-1}
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path stroke="#888" strokeWidth="2" d="M17 7v7a5 5 0 0 1-10 0V7a3 3 0 0 1 6 0v7a1 1 0 0 1-2 0V7"/>
          </svg>
        </button>
        <button
          type="button"
          className="p-2 hover:bg-gray-100 rounded"
          title="Emoji"
          tabIndex={-1}
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="#888" strokeWidth="2"/>
            <path stroke="#888" strokeWidth="2" d="M8 15s1.5 2 4 2 4-2 4-2"/>
            <circle cx="9" cy="10" r="1" fill="#888"/>
            <circle cx="15" cy="10" r="1" fill="#888"/>
          </svg>
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading || !input.trim()}
        >
          {loading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;