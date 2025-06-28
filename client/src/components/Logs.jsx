import React, { useEffect, useState } from 'react';

const Logs = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/logs")  // You must create this backend route
      .then(res => res.json())
      .then(data => setLogs(data));
  }, []);

  return (
    <div className="ml-64 p-6">
      <h2 className="text-2xl font-bold mb-4">📁 Chat History Logs</h2>
      <div className="bg-white rounded shadow p-4 space-y-3">
        {logs.length === 0 ? (
          <p className="text-gray-500">No chat logs available.</p>
        ) : (
          logs.map((entry, index) => (
            <div key={index} className="border-b pb-2">
              <p><strong>User:</strong> {entry.user}</p>
              <p><strong>Bot:</strong> {entry.bot}</p>
              <p><em>Stress Score: {entry.stress}</em></p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Logs;