import React, { useState } from 'react';

const TwitterAnalyzer = (props) => {
  const [handle, setHandle] = useState('');
  const [token, setToken] = useState('');
  const [result, setResult] = useState(null);

  const analyzeTwitter = async () => {
    try {
      const res = await fetch('http://localhost:5000/analyze_twitter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, token }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Twitter analysis failed', err);
    }
  };

  return (
    <div className="bg-white p-4 shadow rounded mb-6">
      <h2 className="text-lg font-bold mb-2">🐦 Twitter Stress Analyzer</h2>
      <input
        type="text"
        placeholder="Twitter handle"
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        className="border px-2 py-1 mr-2"
      />
      <input
        type="text"
        placeholder="Bearer token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        className="border px-2 py-1"
      />
      <button onClick={analyzeTwitter} className="ml-2 px-4 py-1 bg-blue-600 text-white rounded">
        Analyze
      </button>

      {result && (
        <div className="mt-4">
          <p>📊 Score: {result.score}</p>
          <p>📝 Tweets Analyzed: {result.tweet_count}</p>
          <ul className="list-disc pl-4 mt-2">
            {result.tweets.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default TwitterAnalyzer;
