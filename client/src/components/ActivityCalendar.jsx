import React from 'react';
import { motion } from 'framer-motion';

const ActivityCalendar = ({ data }) => {
  // Generate calendar data for the past year
  const generateCalendarData = () => {
    const days = [];
    const today = new Date();
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const dayCount = Math.floor((today - yearStart) / (1000 * 60 * 60 * 24)) + 1;
    
    for (let i = 0; i < dayCount; i++) {
      const date = new Date(yearStart);
      date.setDate(date.getDate() + i);
      
      // Random activity data for demonstration
      const count = Math.floor(Math.random() * 5);
      const level = count === 0 ? 0 : count < 2 ? 1 : count < 4 ? 2 : 3;
      
      days.push({
        date: date.toISOString().split('T')[0],
        count,
        level
      });
    }
    
    return days;
  };

  const calendarData = generateCalendarData();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const getColorIntensity = (level) => {
    switch(level) {
      case 0: return 'bg-gray-800';
      case 1: return 'bg-green-500/30';
      case 2: return 'bg-green-500/60';
      case 3: return 'bg-green-500';
      default: return 'bg-gray-800';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-2xl p-6 shadow-lg"
    >
      <h2 className="text-xl font-bold mb-4">Activity Calendar</h2>
      <div className="overflow-x-auto">
        <div className="flex mb-2">
          {months.map((month, i) => (
            <div key={i} className="text-xs text-gray-400" style={{ minWidth: '14.28%' }}>
              {month}
            </div>
          ))}
        </div>
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {calendarData.map((day, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-sm ${getColorIntensity(day.level)}`}
              title={`${day.date}: ${day.count} problems solved`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-800"></div>
            <div className="w-3 h-3 rounded-sm bg-green-500/30"></div>
            <div className="w-3 h-3 rounded-sm bg-green-500/60"></div>
            <div className="w-3 h-3 rounded-sm bg-green-500"></div>
          </div>
          <span>More</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ActivityCalendar;