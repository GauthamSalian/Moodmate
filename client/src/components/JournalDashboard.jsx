import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const emotionColors = {
  joy: "#FFD700",
  sadness: "#1E90FF",
  anger: "#FF4500",
  fear: "#8A2BE2",
  surprise: "#FF69B4",
  calm: "#00CED1",
  neutral: "#A9A9A9",
};

const MAX_LENGTH = 1000;

const JournalDashboard = () => {
  const [entry, setEntry] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [savedEntry, setSavedEntry] = useState(null);
  const [wordEmotions, setWordEmotions] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entryId, setEntryId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

  const prompt = "How was your day? What emotions stood out?";

  useEffect(() => {
    fetch("http://localhost:8000/journal-entries")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEntries(data);
        } else {
          console.error("Expected array but got:", data);
          setEntries([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching entries:", err);
        setEntries([]);
      });
  }, [savedEntry]);

  const handleSave = async () => {
    const formattedDate = selectedDate.toISOString().split("T")[0];
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing
      ? `http://localhost:8000/journal-entry/${entryId}`
      : "http://localhost:8000/journal-entry";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: entry.replace(/[^\x20-\x7E]/g, ""),
        date: formattedDate,
      }),
    });

    const data = await response.json();
    setSavedEntry(data);
    setWordEmotions(data.word_emotions);
    setEntry("");
    setCharCount(0);
    setIsEditing(false);
    setEntryId(data.id);
  };


  const handleDelete = () => {
    setEntry("");
    setSavedEntry(null);
    setWordEmotions([]);
  };

  const getEmotionForDate = (date) => {
    const formattedDate = date.toISOString().split("T")[0]; // "YYYY-MM-DD"
    const match = entries.find((entry) => entry.date === formattedDate);
    return match ? match.dominant_emotion : null;
  };

  const tileContent = ({ date }) => {
    const emotion = getEmotionForDate(date);
    return emotion ? (
      <div
        className="w-2 h-2 rounded-full mx-auto mt-1"
        style={{ backgroundColor: emotionColors[emotion] || "#ccc" }}
      />
    ) : null;
  };

  const renderColoredSentence = () => {
    if (!savedEntry || !wordEmotions.length) return null;
    const textWords = savedEntry.text.split(/(\s+)/);
    const wordMap = {};
    wordEmotions.forEach((w) => {
      const clean = w.text.toLowerCase().replace(/[.,!?;:]+$/, "");
      wordMap[clean] = { emotion: w.emotion, score: w.score };
    });

    return textWords.map((word, idx) => {
      const clean = word.toLowerCase().replace(/[.,!?;:]+$/, "");
      const emotion = wordMap[clean]?.emotion;
      const color = emotionColors[emotion];
      return (
        <span
          key={idx}
          style={{ color: color || "inherit", fontWeight: emotion ? 600 : "normal" }}
        >
          {word}
        </span>
      );
    });
  };

  const fetchEntryByDate = async (date) => {
    const formattedDate = date.toISOString().split("T")[0];
    console.log("Fetching for date:", formattedDate);
    setSelectedDate(date);
    try {
      const res = await fetch(`http://localhost:8000/journal-entry/by-date?date=${formattedDate}`);
      if (!res.ok) {
        // No entry for this date
        setSavedEntry(null);
        setWordEmotions([]);
        setEntry("");
        setEntryId(null);
        setIsEditing(false);
        setIsViewing(true);
        return;
      }
      const data = await res.json();
      setSavedEntry(data);
      setWordEmotions(data.word_emotions);
      setEntryId(data.id);
      setIsEditing(false);
      setIsViewing(true);
      setEntry(data.text); // Pre-fill text area for editing
      setCharCount(data.text.length);
    } catch (err) {
      console.error("Error fetching entry:", err);
    }
  };


  return (
    <div className="w-full h-screen p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Journal Entry Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 h-full md:col-span-2">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          Daily Journal
        </h2>
        {!savedEntry || isEditing ? (
          <>
            <p className="text-sm text-gray-500 italic mb-2">{prompt}</p>
            <textarea
              className="w-full h-80 p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-900 dark:text-white resize-none"
              value={entry}
              onChange={(e) => {
                setEntry(e.target.value);
                setCharCount(e.target.value.length);
              }}
              maxLength={MAX_LENGTH}
              placeholder="Write your thoughts here..."
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {charCount}/{MAX_LENGTH}
              </span>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                disabled={entry.trim() === ""}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setIsViewing(true);
                  setEntry(savedEntry.text); // Reset entry
                  setCharCount(savedEntry.text.length);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 ml-2"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg text-gray-800 dark:text-gray-100">
              {renderColoredSentence()}
              {isViewing && !isEditing && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setIsViewing(false);
                      setEntry(savedEntry.text);
                      setCharCount(savedEntry.text.length);
                    }}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600"
                  >
                    ✏️ Edit
                  </button>

                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>

            {savedEntry?.dominant_emotion && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg shadow-inner space-y-1">
                <div>
                  🎯 <strong>Dominant Emotion:</strong>{" "}
                  {savedEntry.dominant_emotion.charAt(0).toUpperCase() +
                    savedEntry.dominant_emotion.slice(1)}
                </div>
                <div>
                  🔍 <strong>Score:</strong> {savedEntry.dominant_score?.toFixed(3) ?? "N/A"}
                </div>
              </div>
            )}

          {savedEntry?.all_emotions && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-lg shadow-inner">
              <h3 className="font-semibold mb-2">📊 All Emotion Scores</h3>
              <ul className="space-y-1">
                <ul className="space-y-1">
                  {savedEntry.all_emotions.map(({ emotion, score }) => (
                    <li key={emotion}>
                      <span
                        style={{
                          color: emotionColors[emotion] || "inherit",
                          fontWeight: 600,
                        }}
                      >
                        {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                      </span>
                      {": "}
                      <span>{Number(score).toFixed(3)}</span>
                    </li>
                  ))}
                </ul>
              </ul>
            </div>
          )}
          </>
        )}
      </div>

      {/* Emotion Calendar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow self-start">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          Emotion Calendar
        </h2>
        <Calendar
          tileContent={tileContent}
          onClickDay={fetchEntryByDate}
        />
      </div>
    </div>
  );
};

export default JournalDashboard;
