import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import axios from "axios";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const StressDashboard = ({ fusionInputs }) => {
  const [history, setHistory] = useState([]);
  const [twitterUsername, setTwitterUsername] = useState("");
  const [twitterResults, setTwitterResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const valid = Object.values(fusionInputs).filter(x => x !== null);
    if (valid.length === 4) {
      const fusionScore = valid.reduce((a, b) => a + b, 0) / 4;
      setHistory(prev => [...prev.slice(-9), { timestamp: new Date().toLocaleTimeString(), score: fusionScore }]);
    }
  }, [fusionInputs]);

  const average =
    history.length > 0
      ? history.reduce((sum, h) => sum + h.score, 0) / history.length
      : 0;

  const chartData = {
    labels: history.map((h) => h.timestamp),
    datasets: [
      {
        label: 'Stress Score',
        data: history.map((h) => h.score),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.3)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Average',
        data: history.map(() => average),
        borderColor: 'rgb(54, 162, 235)',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
      {
        label: 'Threshold (0.7)',
        data: history.map(() => 0.7),
        borderColor: 'orange',
        borderDash: [2, 2],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const options = {
    scales: {
      y: {
        min: 0,
        max: 1,
        title: {
          display: true,
          text: 'Score',
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          usePointStyle: true,
          boxWidth: 12,
        },
      },
    },
  };

  // Twitter analysis handler
  const handleAnalyze = async () => {
  setLoading(true);
  setError("");
  setTwitterResults(null);
  try {
    const res = await axios.get(
      `http://localhost:8000/analyze_tweets/${twitterUsername}`
    );
    if (res.data.results) {
      setTwitterResults(res.data.results);
    } else {
      setError(res.data.error || "No results found.");
    }
  } catch (err) {
    setError("Failed to fetch Twitter analysis.");
  }
  setLoading(false);
};

  return (
    <div className="ml-64 p-6">
      <h2 className="text-2xl font-bold mb-4">📊 Stress Fusion Dashboard</h2>
      <div className="bg-white p-4 rounded shadow space-y-4">
        <p className="text-lg">🧠 Fusion Stress Score (Live)</p>
        <Line data={chartData} options={options} />

        <div className="mt-4">
          <h3 className="text-lg font-semibold">Latest Scores:</h3>
          <ul className="list-disc ml-5 text-sm">
            {Object.entries(fusionInputs).map(([key, val]) => (
              <li key={key}>{key.toUpperCase()}: {val !== null ? val.toFixed(2) : 'Not captured'}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Twitter Analysis Section */}
      <div className="mt-8 bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Twitter Stress Analysis</h3>
        <input
          type="text"
          placeholder="Enter Twitter username"
          value={twitterUsername}
          onChange={e => setTwitterUsername(e.target.value)}
          className="border px-2 py-1 rounded mr-2"
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !twitterUsername}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          {loading ? "Analyzing..." : "Analyze Tweets"}
        </button>
        {loading && <div className="text-blue-500 mt-2">Loading...</div>}
        {error && <div className="text-red-500 mt-2">{error}</div>}
        {twitterResults && (
          <div className="mt-4">
            <h4 className="font-semibold">Results:</h4>
            <ul className="list-disc ml-5 text-sm">
              {twitterResults.map((tweet, idx) => (
                <li key={idx}>
                  <strong>{tweet.date}:</strong> {tweet.text}
                  <br />
                  Risk: {tweet.risk_detected}, Confidence: {tweet.confidence}, Probability: {tweet.probability_of_risk}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default StressDashboard;