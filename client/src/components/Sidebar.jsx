import React, { useState, useEffect } from 'react';
import moodmateLogo from "../assets/moodmate-logo.png";
import { Link } from "react-router-dom";
import {
  BotMessageSquare,
  ChartNoAxesCombined,
  SquareActivity,
  Logs,
  Menu,
  Moon,
  HeartHandshake,
  Hash,
  LogOut,
  HeartPulse,
  BookText, // ✅ Added for Library
  NotebookText,
  Repeat,
} from 'lucide-react';

const menuItems = [
  { icon: <BotMessageSquare size={18} />, label: 'Chatbot', path: '/chatbot' },
  { icon: <ChartNoAxesCombined size={18} />, label: 'Stress Dashboard', path: '/dashboard' },
  { icon: <SquareActivity size={18} />, label: 'Input Monitor', path: '/inputs' },
  { icon: <Logs size={18} />, label: 'Chat Logs', path: '/logs' },
  { icon: <HeartHandshake size={18} />, label: 'Book a Session', path: '/book' },
  { icon: <Hash size={18} />, label: 'Twitter Analyzer', path: '/twitter' },
  { icon: <HeartPulse size={18} />, label: 'Google Fit', path: '/sleep' },,
  { icon: <Repeat size={18} />, label: 'Habit Flow', path: '/habits' },
  { icon: <BookText size={18} />, label: 'Library', path: '/library' }, // ✅ Added Library here
  { icon: <NotebookText size={18} />, label: 'Journal', path: '/journal' }
];

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const [activeItem, setActiveItem] = useState('Posts');

  return (
    <div className={`fixed top-0 left-0 h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 shadow-md p-4 flex flex-col justify-between transition-all duration-300 z-30 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="h-screen bg-white dark:bg-gray-900 shadow-md p-4 flex flex-col justify-between transition-all duration-300">
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className={`text-xl font-bold text-blue-600 flex items-center gap-2 transition-all ${isCollapsed ? 'justify-center w-full' : ''}`}>
              <div className="bg-blue-100 p-2 rounded-full">
                <img
                  src={moodmateLogo}
                  alt="Moodmate Logo"
                  className="w-10 h-10 object-contain"
                  style={{ borderRadius: "9999px" }}
                />
              </div>
              {!isCollapsed && 'Moodmate'}
            </div>
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-gray-500 hover:text-blue-600">
              <Menu size={20} />
            </button>
          </div>

          <ul className="space-y-2">
            {menuItems.map(({ icon, label, badge, path }) => (
              <li
                key={label}
                onClick={() => setActiveItem(label)}
                className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors duration-200 ${
                  activeItem === label
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Link to={path} className="flex items-center gap-3 w-full">
                  {icon}
                  {!isCollapsed && <span>{label}</span>}
                  {!isCollapsed && badge && (
                    <span className="text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded">
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Moon size={16} />
              {!isCollapsed && 'Dark Mode'}
            </div>
            {!isCollapsed && (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={darkMode}
                  onChange={() => setDarkMode(!darkMode)}
                />
                <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 transition duration-300"></div>
                <div className="absolute left-1 top-1 bg-white w-3.5 h-3.5 rounded-full transition-all peer-checked:translate-x-4"></div>
              </label>
            )}
          </div>

          <button className="flex items-center gap-2 w-full text-white bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md text-sm">
            <LogOut size={16} />
            {!isCollapsed && 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );
}
