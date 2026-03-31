import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Rocket, Calendar, Bell, Mail, Sparkles, Clock, Star } from "lucide-react";

const UnderConstruction = () => {
  // Target launch date (adjust as needed)
  const targetDate = new Date("2026-05-01T00:00:00");

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  // Floating particles (optimized)
  const floatingParticles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      size: Math.random() * 8 + 3,
      duration: 4 + Math.random() * 5,
      delay: Math.random() * 2,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      color: `rgba(${Math.floor(Math.random() * 100 + 155)}, ${Math.floor(
        Math.random() * 100 + 100
      )}, 255, 0.4)`,
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Rotating background elements */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute top-10 left-10 text-white/5 text-8xl md:text-9xl"
      >
        🚀
      </motion.div>
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-10 right-10 text-white/5 text-8xl md:text-9xl"
      >
        ✨
      </motion.div>

      {/* Floating particles */}
      {floatingParticles.map((particle) => (
        <motion.div
          key={particle.id}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
          }}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            background: particle.color,
            top: particle.top,
            left: particle.left,
          }}
        />
      ))}

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-black/50 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-10 max-w-2xl w-full text-center relative overflow-hidden border border-white/20"
      >
        <div className="absolute -inset-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl opacity-20 blur-xl"></div>

        <div className="relative z-10">
          {/* Animated rocket icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="flex justify-center mb-6"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="relative">
                <Rocket size={70} className="text-pink-400 mx-auto drop-shadow-lg" />
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles size={20} className="text-yellow-300" />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-pink-400"
          >
            Coming Soon
          </motion.h1>

          {/* Subtitle with calendar icon */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center text-gray-200 mb-6"
          >
            <Calendar className="mr-2 text-pink-400" size={18} />
            <p className="text-md">We're launching very soon!</p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-gray-300 mb-8 text-md"
          >
            Something extraordinary is on the horizon. Get ready for a fresh digital experience.
          </motion.p>

          {/* Countdown timer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="grid grid-cols-4 gap-2 mb-8"
          >
            {Object.entries(timeLeft).map(([unit, value]) => (
              <div key={unit} className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">
                <div className="text-2xl md:text-3xl font-bold text-white">{value}</div>
                <div className="text-xs text-gray-300 uppercase">{unit}</div>
              </div>
            ))}
          </motion.div>

          {/* Notification card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/20"
          >
            <p className="text-gray-200 mb-3 text-sm flex items-center justify-center">
              <Bell size={16} className="mr-2 text-yellow-300" />
              Be the first to know when we go live
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <input
                type="email"
                placeholder="Your email address"
                className="px-4 py-2 rounded-lg bg-black/40 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 flex-grow text-sm"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-500 to-pink-500 text-white px-5 py-2 rounded-lg font-medium flex items-center justify-center text-sm shadow-lg"
              >
                <Mail size={16} className="mr-1" />
                Notify Me
              </motion.button>
            </div>
          </motion.div>

          {/* Animated dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="flex justify-center space-x-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -8, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                className="w-2 h-2 bg-gradient-to-r from-blue-400 to-pink-400 rounded-full"
              />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default UnderConstruction;