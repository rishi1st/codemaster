import React from "react";
import { motion } from "framer-motion";
import { 
  Sun, 
  Moon, 
  Maximize2, 
  Minimize2, 
  Play, 
  Square, 
  RotateCcw,
  Settings 
} from "lucide-react";

const UtilityBar = ({
  time,
  isRunning,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  isFullscreen,
  onToggleFullscreen,
  theme,
  onToggleTheme,
  fontSize,
  onIncreaseFontSize,
  onDecreaseFontSize,
  problemTitle,
  difficulty,
  onToggleSettings
}) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const difficultyColors = {
    easy: "bg-green-900/30 text-green-400 border-green-700/50",
    medium: "bg-yellow-900/30 text-yellow-400 border-yellow-700/50",
    hard: "bg-red-900/30 text-red-400 border-red-700/50",
  };

  return (
    <motion.div
      className="sticky top-0 z-40 bg-gray-800/80 backdrop-blur-md border-b border-gray-700/30 px-6 py-3 shadow-lg flex justify-between items-center"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 15 }}
    >
      {/* Left: Problem title and difficulty */}
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-white">{problemTitle || 'Problem'}</h1>
        {difficulty && (
          <span
            className={`ml-3 px-3 py-1 rounded-full text-xs font-medium border ${
              difficultyColors[difficulty.toLowerCase()] || 'bg-gray-700/30 text-gray-300'
            }`}
          >
            {difficulty}
          </span>
        )}
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-4">
        {/* Timer */}
        <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-1.5">
          <span className="font-mono text-sm text-gray-200">{formatTime(time)}</span>
          <div className="flex gap-1">
            {!isRunning ? (
              <button
                className="p-1 text-green-400 hover:text-green-300 transition-colors rounded hover:bg-gray-600/50"
                onClick={onStartTimer}
                title="Start Timer"
              >
                <Play size={14} />
              </button>
            ) : (
              <button
                className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors rounded hover:bg-gray-600/50"
                onClick={onPauseTimer}
                title="Pause Timer"
              >
                <Square size={14} />
              </button>
            )}
            <button
              className="p-1 text-red-400 hover:text-red-300 transition-colors rounded hover:bg-gray-600/50"
              onClick={onResetTimer}
              title="Reset Timer"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Font Size */}
        <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-1.5">
          <button
            className="p-1 text-gray-400 hover:text-gray-300 transition-colors rounded hover:bg-gray-600/50"
            onClick={onDecreaseFontSize}
            title="Decrease Font Size"
          >
            A-
          </button>
          <span className="text-xs text-gray-300">{fontSize}px</span>
          <button
            className="p-1 text-gray-400 hover:text-gray-300 transition-colors rounded hover:bg-gray-600/50"
            onClick={onIncreaseFontSize}
            title="Increase Font Size"
          >
            A+
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          className="p-2 text-gray-400 hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-700/50"
          onClick={onToggleTheme}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Fullscreen Toggle */}
        <button
          className="p-2 text-gray-400 hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-700/50"
          onClick={onToggleFullscreen}
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>

        {/* Settings Toggle */}
        <button
          className="p-2 text-gray-400 hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-700/50"
          onClick={onToggleSettings}
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </motion.div>
  );
};

export default UtilityBar;