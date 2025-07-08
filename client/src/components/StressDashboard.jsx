import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Flame, HeartPulse, Sparkles, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';

const quotes = [
  "Small habits make a big difference.",
  "Consistency beats intensity.",
  "Every action is a vote for the person you want to become.",
  "You do not rise to the level of your goals. You fall to the level of your systems.",
  "Stress is a signal. Listen and adapt."
];

const getStressMood = (score) => {
  if (score <= 30) return { emoji: "😌", label: "Relaxed", color: "text-green-600" };
  if (score <= 60) return { emoji: "😐", label: "Moderate", color: "text-yellow-600" };
  return { emoji: "😫", label: "Stressed", color: "text-red-600" };
};

const getRank = (level) => {
  if (level >= 15) return 'Diamond';
  if (level >= 10) return 'Gold';
  if (level >= 5) return 'Silver';
  return 'Bronze';
};

const HomeDashboard = () => {
  const [history, setHistory] = useState([]);
  const [quote, setQuote] = useState("");
  const [habitProgress, setHabitProgress] = useState([]);
  const [habitRank, setHabitRank] = useState({ level: 0, rank: 'Bronze' });
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('manualFitHistory') || '{}');
    const formatted = Object.entries(data).map(([date, entry]) => ({
      date,
      sleep: entry.sleep,
      hrv: entry.hrv,
      stress: computeStress(entry.sleep, entry.hrv),
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
    setHistory(formatted);

    const todayQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(todayQuote);

    const habitData = JSON.parse(localStorage.getItem("habitflowData") || "{}");
    const replacement = habitData.chosenReplacement || habitData.currentHabits?.[0] || 'No habit selected';
    setHabitProgress([{ name: replacement, streak: habitData.streak || 0 }]);

    const level = habitData.level || 0;
    const rank = getRank(level);
    setHabitRank({ level, rank });

    if ((habitData.streak || 0) > 0 && (habitData.streak % 5 === 0)) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, []);

  const computeStress = (sleep, hrv) => {
    const normalizedSleep = Math.min(sleep / 8, 1);
    const normalizedHRV = Math.min(hrv / 50, 1);
    const score = 100 - ((normalizedSleep + normalizedHRV) / 2) * 100;
    return Math.round(score);
  };

  return (
    <motion.div 
      className="p-6 max-w-6xl mx-auto"
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.6 }}
    >
      {showConfetti && <Confetti recycle={false} numberOfPieces={300} />}

      <motion.h2 
        className="text-3xl font-bold mb-4 text-center text-blue-700"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        📊 MoodMate Daily Dashboard
      </motion.h2>

      {history.length > 0 ? (
        <>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card title="Latest Sleep" icon={<HeartPulse className="text-blue-500" />} value={`${history.at(-1).sleep.toFixed(1)} hrs`} />
            <Card title="Latest HRV" icon={<HeartPulse className="text-pink-500" />} value={`${history.at(-1).hrv.toFixed(1)} ms`} />
            <Card 
              title="Stress Score" 
              icon={<Flame className="text-red-500" />} 
              value={(score => {
                const { emoji, label, color } = getStressMood(score);
                return <span className={`flex flex-col items-center ${color}`}>{score} / 100 <span>{emoji} {label}</span></span>;
              })(history.at(-1).stress)} 
            />
          </motion.div>

          {habitProgress.length > 0 && (
            <motion.div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">🧩 Habit Progress</h3>
              <ul className="space-y-2">
                {habitProgress.map((h, idx) => (
                  <li key={idx} className="flex justify-between items-center p-2 border-b dark:border-gray-700">
                    <span className="text-gray-700 dark:text-gray-300">{h.name}</span>
                    <motion.span 
                      className="font-semibold text-green-600 dark:text-green-400"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatType: 'mirror' }}
                    >
                      🔥 {h.streak} day streak
                    </motion.span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <ShieldCheck className="h-5 w-5" /> Level {habitRank.level} - {habitRank.rank}
              </div>
            </motion.div>
          )}

          <motion.div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Stress Trend Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="stress" stroke="#f87171" strokeWidth={2} isAnimationActive={true} animationDuration={1000} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 p-4 rounded-xl text-center shadow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <p className="italic">💡 {quote}</p>
          </motion.div>
        </>
      ) : (
        <motion.div className="text-center text-gray-500 mt-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          No data available. Please input sleep and HRV data.
        </motion.div>
      )}
    </motion.div>
  );
};

const Card = ({ title, icon, value }) => (
  <motion.div 
    className="bg-white dark:bg-gray-900 shadow-md p-5 rounded-xl text-center"
    whileHover={{ scale: 1.03 }}
  >
    <div className="flex justify-center items-center mb-3">{icon}</div>
    <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</h4>
    <div className="text-2xl font-bold text-blue-700 dark:text-white">{value}</div>
  </motion.div>
);

export default HomeDashboard;
