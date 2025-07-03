import React, { useEffect, useState } from 'react';

const CLIENT_ID = "627671962369-t1kbnpv6e502iqlr8fgpl41ss5gvr43q.apps.googleusercontent.com";
const SCOPES = [
  "https://www.googleapis.com/auth/fitness.sleep.read",
  "https://www.googleapis.com/auth/fitness.heart_rate.read"
].join(" ");

function GoogleFitAuth({ onDataFetched }) {
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [sleep, setSleep] = useState(null);
  const [hrv, setHrv] = useState(null);

  const fetchGoogleFitData = async (accessToken) => {
    setStatus("loading");
    const now = Date.now();
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

    try {
      const res = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          aggregateBy: [
            { dataTypeName: "com.google.sleep.segment" },
            { dataTypeName: "com.google.heart_rate.bpm" }
          ],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: threeDaysAgo,
          endTimeMillis: now
        })
      });

      const result = await res.json();
      const sleepBuckets = result.bucket || [];

      let totalSleepMs = 0;
      let hrvReadings = [];

      for (let bucket of sleepBuckets) {
        for (let dataset of bucket.dataset) {
          for (let point of dataset.point) {
            const start = parseInt(point.startTimeNanos) / 1e6;
            const end = parseInt(point.endTimeNanos) / 1e6;
            const duration = end - start;

            if (dataset.dataSourceId.includes("sleep")) {
              totalSleepMs += duration;
            } else if (dataset.dataSourceId.includes("heart_rate")) {
              for (let val of point.value) {
                hrvReadings.push(val.fpVal);
              }
            }
          }
        }
      }

      const totalSleepHrs = totalSleepMs / (1000 * 60 * 60);
      const avgHRV = hrvReadings.length
        ? hrvReadings.reduce((a, b) => a + b, 0) / hrvReadings.length
        : null;

      setSleep(totalSleepHrs);
      setHrv(avgHRV);
      setStatus("success");

      if (onDataFetched) {
        onDataFetched({ sleep: totalSleepHrs, hrv: avgHRV });
      }
    } catch (err) {
      setStatus("error");
    }
  };

  const loadGoogleAuth = () => {
    window.gapi.load('client:auth2', () => {
      window.gapi.client.init({
        clientId: CLIENT_ID,
        scope: SCOPES
      }).then(() => {
        const auth = window.gapi.auth2.getAuthInstance();
        auth.signIn().then(user => {
          const token = user.getAuthResponse().access_token;
          fetchGoogleFitData(token);
        }).catch(() => setStatus("error"));
      });
    });
  };

  useEffect(() => {
    setStatus("loading");
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = loadGoogleAuth;
    document.body.appendChild(script);
    // eslint-disable-next-line
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl shadow-lg p-8 flex flex-col items-center relative overflow-hidden transition-colors duration-300">
        {/* Animated Google Fit Icon */}
        <div className="mb-6">
          <svg className={`animate-spin-slow ${status === "success" ? "text-green-400" : "text-blue-500"}`} width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="8" opacity="0.2"/>
            <path d="M32 4a28 28 0 1 1-19.8 47.8" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-blue-700">Google Fit Authorization</h2>
        <p className="text-gray-600 mb-6 text-center">
          Connecting to your Google Fit account to fetch your recent sleep and heart rate data.
        </p>
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <div className="loader mb-2"></div>
            <span className="text-blue-500 font-medium animate-pulse">Authorizing and fetching data...</span>
          </div>
        )}
        {status === "success" && (
          <div className="w-full text-center animate-fade-in">
            <div className="mb-4">
              <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold mb-2">
                ✅ Data fetched successfully!
              </span>
            </div>
            <div className="flex justify-center gap-8 mb-2">
              <div>
                <div className="text-lg font-bold text-blue-700">{sleep?.toFixed(2) ?? "--"}</div>
                <div className="text-gray-500 text-sm">Sleep (hrs)</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-700">{hrv ? hrv.toFixed(2) : "--"}</div>
                <div className="text-gray-500 text-sm">Avg HRV</div>
              </div>
            </div>
          </div>
        )}
        {status === "error" && (
          <div className="w-full text-center animate-fade-in">
            <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold mb-2">
              ❌ Failed to fetch data. Please try again.
            </span>
          </div>
        )}
      </div>
      {/* Animations */}
      <style>{`
        .animate-spin-slow {
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        .loader {
          border: 4px solid #e0e7ef;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          animation: spin 1s linear infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.7s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px);}
          to { opacity: 1; transform: translateY(0);}
        }
      `}</style>
    </div>
  );
}

export default GoogleFitAuth;
