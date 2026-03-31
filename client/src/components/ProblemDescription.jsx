import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, BarChart3, Tag, Lightbulb, Target, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';

const ProblemDescription = ({ problem }) => {
  const [showHint, setShowHint] = useState(false);
  const [expandedExample, setExpandedExample] = useState(null);
  

  const [memoryLimit] = useState(
    problem.memoryLimit || `${Math.floor(Math.random() * 50) + 128} MB`
  );

  const [acceptanceRate] = useState(
    problem.acceptanceRate || `${Math.floor(Math.random() * 30) + 40}%`
  );
  
  // Calculate expected time based on difficulty
  const getExpectedTime = () => {
    switch (problem.difficulty.toLowerCase()) {
      case 'easy': return '15-20 min';
      case 'medium': return '25-35 min';
      case 'hard': return '45-60 min';
      default: return '20-30 min';
    }
  };

  // Generate memory and acceptance rate if not provided


  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'hard': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Parse tags if they're in string format
  const tagsArray = Array.isArray(problem.tags) 
    ? problem.tags 
    : (problem.tags || '').split(',').map(tag => tag.trim());

  // Toggle example expansion
  const toggleExample = (index) => {
    setExpandedExample(expandedExample === index ? null : index);
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-gray-900 to-black text-gray-200 p-6">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {problem.title}
          </h1>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${getDifficultyColor(problem.difficulty)}`}>
            {problem.difficulty}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm mb-5">
          <div className="flex items-center gap-2 bg-gray-800/60 px-3 py-1.5 rounded-lg">
            <Clock size={16} className="text-blue-400" />
            <span>Expected: {getExpectedTime()}</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-800/60 px-3 py-1.5 rounded-lg">
            <BarChart3 size={16} className="text-purple-400" />
            <span>Memory: {memoryLimit}</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-800/60 px-3 py-1.5 rounded-lg">
            <Target size={16} className="text-green-400" />
            <span>Acceptance: {acceptanceRate}</span>
          </div>
        </div>
        
        {tagsArray.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <Tag size={16} className="text-gray-400" />
            {tagsArray.map((tag, index) => (
              <span key={index} className="px-3 py-1 bg-blue-500/10 text-blue-300 text-xs rounded-full border border-blue-500/20">
                {tag}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* Description Section */}
      <motion.section 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-8"
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 pb-2 border-b border-gray-700">
          <div className="w-2 h-5 bg-blue-500 rounded-full"></div>
          Description
        </h2>
        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
          {problem.description}
        </div>
      </motion.section>

      {/* Examples Section */}
      <motion.section 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 pb-2 border-b border-gray-700">
          <div className="w-2 h-5 bg-purple-500 rounded-full"></div>
          Examples
        </h2>
        <div className="space-y-4">
          {problem.visibleTestCases.map((example, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden"
            >
              <button
                className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-700/30 transition-colors"
                onClick={() => toggleExample(index)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-purple-400 font-semibold">{index + 1}</span>
                  </div>
                  <h4 className="font-semibold">Example {index + 1}</h4>
                </div>
                {expandedExample === index ? (
                  <ChevronUp size={20} className="text-gray-400" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400" />
                )}
              </button>
              
              <AnimatePresence>
                {expandedExample === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
                          <AlertCircle size={16} />
                          Input:
                        </div>
                        <div className="bg-gray-900 p-3 rounded-lg font-mono text-sm">
                          {example.input}
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
                          <CheckCircle size={16} />
                          Output:
                        </div>
                        <div className="bg-gray-900 p-3 rounded-lg font-mono text-sm">
                          {example.output}
                        </div>
                      </div>
                      
                      {example.explanation && (
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
                            <Lightbulb size={16} />
                            Explanation:
                          </div>
                          <div className="bg-gray-900/80 p-3 rounded-lg text-sm">
                            {example.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Constraints Section */}
      <motion.section 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mb-8"
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 pb-2 border-b border-gray-700">
          <div className="w-2 h-5 bg-red-500 rounded-full"></div>
          Constraints
        </h2>
        {problem.constraints ? (
          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4">
            <ul className="space-y-3 text-sm">
              {problem.constraints.map((constraint, index) => (
                <motion.li 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="leading-relaxed">{constraint}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No constraints specified.</p>
        )}
      </motion.section>

      {/* Hint Section */}
      <motion.section 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mb-8"
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 pb-2 border-b border-gray-700">
          <div className="w-2 h-5 bg-yellow-500 rounded-full"></div>
          <Lightbulb size={20} className="text-yellow-400" /> 
          Hint
        </h2>
        
        {problem.hint ? (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl overflow-hidden">
            <motion.button
              whileHover={{ backgroundColor: 'rgba(234, 179, 8, 0.15)' }}
              className="w-full p-4 text-left flex justify-between items-center"
              onClick={() => setShowHint(!showHint)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Lightbulb size={16} className="text-yellow-400" />
                </div>
                <span className="font-medium text-yellow-300">
                  {showHint ? 'Hide Hint' : 'Reveal Hint'}
                </span>
              </div>
              <div className="text-xl">{showHint ? '🙈' : '👀'}</div>
            </motion.button>
            
            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 text-yellow-200">
                    {problem.hint}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4 text-center">
            <p className="text-gray-400">No hints available for this problem.</p>
          </div>
        )}
      </motion.section>
    </div>
  );
};

export default ProblemDescription;