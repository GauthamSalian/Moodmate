import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, AlarmClock, Gift, Flame, ShieldCheck, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import html2canvas from 'html2canvas';
import { Particles } from "react-tsparticles";
import { tsParticles } from "tsparticles-engine";
import { loadFull } from 'tsparticles';


const rankMessages = {
  Bronze: 'You’ve taken the first step — keep the momentum going! 💪',
  Silver: 'Awesome work! You’re building consistency. 🚀',
  Gold: 'You’re crushing it! Keep shining! 🌟',
  Diamond: 'You’re unstoppable! True habit master! 👑'
};

const getRank = (level) => {
  if (level >= 15) return 'Diamond';
  if (level >= 10) return 'Gold';
  if (level >= 5) return 'Silver';
  return 'Bronze';
};

const HabitFlow = () => {
  const [currentHabits, setCurrentHabits] = useState([]);
  const [inputHabit, setInputHabit] = useState('');
  const [selectedBadHabit, setSelectedBadHabit] = useState('');
  const [suggestedHabits, setSuggestedHabits] = useState([]);
  const [customHabit, setCustomHabit] = useState('');
  const [chosenReplacement, setChosenReplacement] = useState('');
  const [showReminder, setShowReminder] = useState(false);
  const [rewardEarned, setRewardEarned] = useState(false);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const audioRef = useRef(null);
  const shareRef = useRef(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('habitflowData'));
    if (saved) {
      setCurrentHabits(saved.currentHabits || []);
      setChosenReplacement(saved.chosenReplacement || '');
      setSelectedBadHabit(saved.selectedBadHabit || '');
      setShowReminder(saved.showReminder || false);
      setStreak(saved.streak || 0);
      setLevel(saved.level || 1);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('habitflowData', JSON.stringify({
      currentHabits,
      selectedBadHabit,
      chosenReplacement,
      showReminder,
      streak,
      level
    }));
  }, [currentHabits, selectedBadHabit, chosenReplacement, showReminder, streak, level]);

  const addHabit = () => {
    if (inputHabit.trim() !== '') {
      setCurrentHabits([...currentHabits, inputHabit.trim()]);
      setInputHabit('');
    }
  };

  const handleSelectBadHabit = async (habit) => {
      setSelectedBadHabit(habit);
      try {
        const res = await fetch("http://localhost:8000/suggest_replacements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bad_habit: habit }),
        });
        const data = await res.json();
        setSuggestedHabits(data.suggestions || []);
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
        setSuggestedHabits(["Take a short walk", "Drink water", "Rest mindfully"]); // fallback
      }
    };


  const handleChooseReplacement = (habit) => {
    setChosenReplacement(habit);
    setShowReminder(true);
  };

  const completeHabit = () => {
    const newStreak = streak + 1;
    setStreak(newStreak);
    if (newStreak % 5 === 0) {
      setLevel(prev => prev + 1);
      setLevelUpVisible(true);
      setShowConfetti(true);
      if (audioRef.current) audioRef.current.play();
      setTimeout(() => {
        setLevelUpVisible(false);
        setShowConfetti(false);
      }, 4000);
    }
    setRewardEarned(true);
    setTimeout(() => setRewardEarned(false), 3000);
  };

  const captureCard = async () => {
    if (!shareRef.current) return;
    const canvas = await html2canvas(shareRef.current);
    const link = document.createElement('a');
    link.download = `HabitFlow_Progress_Level${level}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const currentRank = getRank(level);
  const rankMessage = rankMessages[currentRank];

  const particlesInit = async () => {
    await loadFull(tsParticles);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 to-purple-100">
      <Particles id="tsparticles" init={particlesInit} options={{
        fullScreen: { enable: false },
        background: { color: "transparent" },
        fpsLimit: 60,
        interactivity: {
          events: { onClick: { enable: true, mode: "push" }, onHover: { enable: true, mode: "repulse" }, resize: true },
          modes: { push: { quantity: 4 }, repulse: { distance: 50, duration: 0.4 } }
        },
        particles: {
          color: { value: ["#6D28D9", "#A78BFA", "#4F46E5"] },
          links: { enable: true, color: "#a855f7", distance: 120 },
          collisions: { enable: true },
          move: { direction: "none", enable: true, outModes: "bounce", random: false, speed: 1, straight: false },
          number: { density: { enable: true, area: 800 }, value: 60 },
          opacity: { value: 0.5 },
          shape: { type: "circle" },
          size: { value: { min: 1, max: 3 } }
        },
        detectRetina: true
      }} />

      <div ref={shareRef} className="max-w-2xl mx-auto mt-10 p-6 bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl space-y-6 border border-purple-200">
        <h2 className="text-3xl font-bold text-center text-purple-800">🌱 HabitFlow - Build Better Habits</h2>
        <audio ref={audioRef} src="https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg" preload="auto" />
        {showConfetti && <Confetti recycle={false} numberOfPieces={300} />} 

        <div className="text-right">
          <button onClick={captureCard} className="text-xs flex items-center gap-1 text-purple-700 hover:underline">
            <Download className="h-4 w-4" /> Share Progress
          </button>
        </div>

        <div className="bg-white shadow-md rounded-xl p-4 space-y-2">
          <p className="font-semibold">1. Add your current habits:</p>
          <div className="flex gap-2">
            <input value={inputHabit} onChange={(e) => setInputHabit(e.target.value)} placeholder="e.g., late-night snacking" className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <button onClick={addHabit} className="px-4 py-2 rounded-md font-semibold bg-purple-600 text-white hover:bg-purple-700 transition">Add</button>
          </div>
          <ul className="list-disc list-inside text-sm">
            {currentHabits.map((habit, i) => (
              <li key={i} className="cursor-pointer hover:text-purple-600" onClick={() => handleSelectBadHabit(habit)}>
                {habit}
              </li>
            ))}
          </ul>
        </div>

        {selectedBadHabit && (
          <div className="bg-white shadow-md rounded-xl p-4 space-y-3">
            <p className="font-semibold">
              2. Replace <span className="italic text-purple-600">{selectedBadHabit}</span> with:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedHabits.map((h, i) => (
                <button key={i} onClick={() => handleChooseReplacement(h)} className="flex items-center gap-2 px-4 py-2 rounded-md border border-purple-600 text-purple-600 hover:bg-purple-50">
                  <Sparkles className="h-4 w-4" /> {h}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">Or enter your own replacement habit:</p>
              <div className="flex gap-2 mt-2">
                <input value={customHabit} onChange={(e) => setCustomHabit(e.target.value)} placeholder="e.g., Journal for 2 minutes" className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                <button onClick={() => handleChooseReplacement(customHabit)} className="px-4 py-2 rounded-md font-semibold bg-purple-100 text-purple-700 hover:bg-purple-200 transition">Use</button>
              </div>
            </div>
          </div>
        )}

        {chosenReplacement && showReminder && (
          <div className="bg-white shadow-md rounded-xl p-4 space-y-3 text-center">
            <p className="text-lg font-semibold text-purple-700">🎯 New Habit Chosen:</p>
            <p className="text-green-600 font-bold text-xl">{chosenReplacement}</p>
            <p className="text-sm text-gray-500 flex items-center justify-center">
              <AlarmClock className="h-4 w-4 mr-1" /> You'll be reminded daily to practice this habit.
            </p>
            <motion.div 
              className="text-sm flex flex-col items-center justify-center text-orange-600"
              initial={{ scale: 0.9 }} 
              animate={{ scale: [1, 1.05, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <motion.div className="rounded-full bg-yellow-100 px-4 py-1 font-semibold shadow">
                Streak: {streak} days | Level: {level} - {currentRank}
              </motion.div>
            </motion.div>
            <button onClick={completeHabit} className="mt-4 px-4 py-2 rounded-md font-semibold bg-purple-600 text-white hover:bg-purple-700 transition">I Did It Today ✅</button>
            <AnimatePresence>
              {levelUpVisible && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1.1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-purple-600 font-bold mt-3 text-lg"
                >
                  🎉 Milestone! You're now level {level} - {currentRank}!
                  <p className="text-sm mt-1 text-gray-700">{rankMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>
            {rewardEarned && (
              <div className="text-green-700 mt-3 flex items-center justify-center font-semibold">
                <Gift className="h-5 w-5 mr-2" /> Great job! You've earned a reward!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitFlow;