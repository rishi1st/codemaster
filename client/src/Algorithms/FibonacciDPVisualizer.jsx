import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, StepForward, StepBack, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react';

const FibonacciDPVisualizer = () => {
  // State management
  const [n, setN] = useState(6);
  const [mode, setMode] = useState('memoization'); // 'memoization' or 'tabulation'
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [speed, setSpeed] = useState(50);
  const [highlightMode, setHighlightMode] = useState('current');
  const [explanation, setExplanation] = useState('');
  const [activeLine, setActiveLine] = useState(-1);
  const [subproblemCount, setSubproblemCount] = useState({ solved: 0, reused: 0 });
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Refs
  const animationInterval = useRef(null);
  const dpTable = useRef({});
  const callStack = useRef([]);
  const treeNodes = useRef(new Map());

  // Fibonacci DP implementations
  const fibonacciMemoization = useCallback((num) => {
    const steps = [];
    const memo = {};
    let stepCount = 0;
    let subproblemsSolved = 0;
    let subproblemsReused = 0;

    const fib = (x, depth = 0, parentId = null) => {
      const nodeId = `${x}-${depth}-${Math.random()}`;
      const callId = `${x}`;
      
      // Step: Function call
      steps.push({
        type: 'call',
        n: x,
        depth,
        nodeId,
        parentId,
        explanation: `Computing F(${x})...`,
        line: 1,
        subproblems: { solved: subproblemsSolved, reused: subproblemsReused }
      });

      // Check memo
      if (memo[x] !== undefined) {
        subproblemsReused++;
        steps.push({
          type: 'return',
          n: x,
          value: memo[x],
          depth,
          nodeId,
          fromMemo: true,
          explanation: `F(${x}) = ${memo[x]} (from memo)`,
          line: 2,
          subproblems: { solved: subproblemsSolved, reused: subproblemsReused }
        });
        return memo[x];
      }

      // Base cases
      if (x <= 1) {
        memo[x] = x;
        subproblemsSolved++;
        steps.push({
          type: 'return',
          n: x,
          value: x,
          depth,
          nodeId,
          fromMemo: false,
          explanation: `F(${x}) = ${x} (base case)`,
          line: 0,
          subproblems: { solved: subproblemsSolved, reused: subproblemsReused }
        });
        return x;
      }

      // Recursive calls
      const leftValue = fib(x - 1, depth + 1, nodeId);
      const rightValue = fib(x - 2, depth + 1, nodeId);
      
      // Compute result
      const result = leftValue + rightValue;
      memo[x] = result;
      subproblemsSolved++;

      steps.push({
        type: 'return',
        n: x,
        value: result,
        depth,
        nodeId,
        fromMemo: false,
        explanation: `F(${x}) = F(${x-1}) + F(${x-2}) = ${leftValue} + ${rightValue} = ${result}`,
        line: 3,
        subproblems: { solved: subproblemsSolved, reused: subproblemsReused }
      });

      return result;
    };

    fib(num);
    return steps;
  }, []);

  const fibonacciTabulation = useCallback((num) => {
    const steps = [];
    const dp = new Array(num + 1);
    let subproblemsSolved = 0;

    // Initial state
    steps.push({
      type: 'init',
      dp: [...dp],
      explanation: 'Initializing DP table...',
      line: 0,
      subproblems: { solved: 0, reused: 0 }
    });

    // Base cases
    dp[0] = 0;
    dp[1] = 1;
    subproblemsSolved += 2;

    steps.push({
      type: 'base',
      index: 0,
      value: 0,
      dp: [...dp],
      explanation: 'Setting base case: F(0) = 0',
      line: 0,
      subproblems: { solved: subproblemsSolved, reused: 0 }
    });

    steps.push({
      type: 'base',
      index: 1,
      value: 1,
      dp: [...dp],
      explanation: 'Setting base case: F(1) = 1',
      line: 0,
      subproblems: { solved: subproblemsSolved, reused: 0 }
    });

    // Fill DP table
    for (let i = 2; i <= num; i++) {
      steps.push({
        type: 'compute_start',
        index: i,
        dp: [...dp],
        explanation: `Computing F(${i}) = F(${i-1}) + F(${i-2})...`,
        line: 1,
        subproblems: { solved: subproblemsSolved, reused: 0 }
      });

      dp[i] = dp[i - 1] + dp[i - 2];
      subproblemsSolved++;

      steps.push({
        type: 'compute_end',
        index: i,
        value: dp[i],
        dp: [...dp],
        explanation: `F(${i}) = ${dp[i-1]} + ${dp[i-2]} = ${dp[i]}`,
        line: 2,
        subproblems: { solved: subproblemsSolved, reused: 0 }
      });
    }

    return steps;
  }, []);

  // Generate steps based on mode and n
  const generateSteps = useCallback(() => {
    if (mode === 'memoization') {
      return fibonacciMemoization(n);
    } else {
      return fibonacciTabulation(n);
    }
  }, [n, mode, fibonacciMemoization, fibonacciTabulation]);

  // Reset visualization
  const resetVisualization = useCallback(() => {
    clearInterval(animationInterval.current);
    setIsPlaying(false);
    setCurrentStep(0);
    setSteps(generateSteps());
    setExplanation('Ready to compute Fibonacci sequence...');
    setActiveLine(-1);
    setSubproblemCount({ solved: 0, reused: 0 });
    setExpandedNodes(new Set());
    dpTable.current = {};
    callStack.current = [];
    treeNodes.current.clear();
  }, [generateSteps]);

  // Initialize
  useEffect(() => {
    resetVisualization();
  }, [resetVisualization]);

  // Play/pause animation
  const togglePlay = () => {
    if (isPlaying) {
      clearInterval(animationInterval.current);
      setIsPlaying(false);
    } else {
      if (currentStep >= steps.length - 1) {
        setCurrentStep(0);
      }
      setIsPlaying(true);
      animationInterval.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) {
            clearInterval(animationInterval.current);
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 - speed * 10);
    }
  };

  // Step forward
  const stepForward = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Step backward
  const stepBackward = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Update state when current step changes
  useEffect(() => {
    if (steps.length > 0 && currentStep < steps.length) {
      const step = steps[currentStep];
      setExplanation(step.explanation);
      setActiveLine(step.line);
      setSubproblemCount(step.subproblems || { solved: 0, reused: 0 });

      // Update DP table for tabulation
      if (mode === 'tabulation' && step.dp) {
        dpTable.current = step.dp.reduce((acc, val, idx) => {
          if (val !== undefined) acc[idx] = val;
          return acc;
        }, {});
      }
    }
  }, [currentStep, steps, mode]);

  // Clean up interval
  useEffect(() => {
    return () => clearInterval(animationInterval.current);
  }, []);

  // Render recursion tree for memoization
  const renderTree = () => {
    if (mode !== 'memoization') return null;

    const currentStepData = steps[currentStep];
    if (!currentStepData) return null;

    const renderNode = (step, allSteps, currentIndex) => {
      const isCurrent = currentIndex === currentStep;
      const isCompleted = currentIndex < currentStep;
      const isMemoized = step.fromMemo;
      
      let bgColor = 'bg-gray-700';
      if (isCurrent) bgColor = 'bg-blue-600';
      else if (isMemoized) bgColor = 'bg-green-600';
      else if (isCompleted) bgColor = 'bg-purple-600';

      return (
        <div key={step.nodeId} className="flex flex-col items-center">
          <div className={`${bgColor} text-white rounded-lg px-3 py-2 min-w-16 text-center transition-all duration-300 border-2 ${
            isCurrent ? 'border-yellow-400' : 'border-transparent'
          }`}>
            <div className="font-bold">F({step.n})</div>
            {step.value !== undefined && (
              <div className="text-xs mt-1">= {step.value}</div>
            )}
            {isMemoized && (
              <div className="text-xs text-yellow-300">memo</div>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <div className="text-white font-semibold mb-4">Recursion Tree:</div>
        <div className="bg-gray-900/50 rounded-lg p-6 min-h-48">
          {steps.slice(0, currentStep + 1)
            .filter(step => step.type === 'call' || step.type === 'return')
            .map((step, index) => renderNode(step, steps, index))}
        </div>
      </div>
    );
  };

  // Render DP table for tabulation
  const renderDPTable = () => {
    if (mode !== 'tabulation') return null;

    const currentStepData = steps[currentStep];
    const computingIndex = currentStepData?.index;

    return (
      <div className="space-y-4">
        <div className="text-white font-semibold mb-4">DP Table:</div>
        <div className="flex flex-wrap gap-2 bg-gray-900/50 rounded-lg p-6">
          {Object.entries(dpTable.current).map(([index, value]) => {
            const isComputing = parseInt(index) === computingIndex;
            const isBase = parseInt(index) <= 1;
            const isCompleted = currentStepData?.dp?.[parseInt(index)] !== undefined;
            
            let bgColor = 'bg-gray-700';
            if (isComputing) bgColor = 'bg-blue-600';
            else if (isBase) bgColor = 'bg-green-600';
            else if (isCompleted) bgColor = 'bg-purple-600';

            return (
              <div key={index} className="flex flex-col items-center">
                <div className="text-gray-400 text-xs mb-1">F({index})</div>
                <div className={`${bgColor} text-white rounded-lg w-16 h-16 flex items-center justify-center font-bold text-lg transition-all duration-300 border-2 ${
                  isComputing ? 'border-yellow-400' : 'border-transparent'
                }`}>
                  {value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Code snippets
  const memoizationCode = [
    "function fib(n, memo = {}) {",
    "  if (n <= 1) return n;           // Base case",
    "  if (memo[n] !== undefined) return memo[n]; // Check memo",
    "  memo[n] = fib(n-1, memo) + fib(n-2, memo); // Recursive call",
    "  return memo[n];",
    "}"
  ];

  const tabulationCode = [
    "function fib(n) {",
    "  if (n <= 1) return n;",
    "  let dp = [0, 1];               // Base cases",
    "  for (let i = 2; i <= n; i++) { // Fill table",
    "    dp[i] = dp[i-1] + dp[i-2];  // State transition",
    "  }",
    "  return dp[n];",
    "}"
  ];

  return (
    <div className="pt-22 min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6 overflow-x-hidden relative">
      {/* Animated background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-teal-500/10 animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 100 + 20}px`,
              height: `${Math.random() * 100 + 20}px`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Fibonacci Dynamic Programming Visualizer</h1>
          <p className="text-lg text-gray-300">
            "The Fibonacci sequence is defined as F(n) = F(n-1) + F(n-2), with F(0)=0 and F(1)=1.
            Dynamic Programming avoids redundant calculations by storing results of subproblems."
            <span className="ml-2 text-cyan-400">Complexity: O(n), Space: O(n) or O(1) (optimized)</span>
          </p>
        </div>

        {/* Controls Section */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Input n */}
            <div className="flex flex-col space-y-2">
              <label className="text-gray-300 text-sm">Fibonacci Term (n):</label>
              <div className="flex">
                <input
                  type="number"
                  value={n}
                  onChange={(e) => setN(Math.max(0, Math.min(20, parseInt(e.target.value) || 0)))}
                  className="flex-grow input input-bordered bg-gray-700/50 border-gray-600 text-white"
                  min="0"
                  max="20"
                />
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex flex-col space-y-2">
              <label className="text-gray-300 text-sm">DP Approach:</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="select select-bordered bg-gray-700/50 border-gray-600 text-white"
              >
                <option value="memoization">Memoization (Top-Down)</option>
                <option value="tabulation">Tabulation (Bottom-Up)</option>
              </select>
            </div>

            {/* Highlight Mode */}
            <div className="flex flex-col space-y-2">
              <label className="text-gray-300 text-sm">Highlight Mode:</label>
              <select
                value={highlightMode}
                onChange={(e) => setHighlightMode(e.target.value)}
                className="select select-bordered bg-gray-700/50 border-gray-600 text-white"
              >
                <option value="current">🔵 Current</option>
                <option value="solved">🟢 Solved</option>
                <option value="result">🟣 Result</option>
              </select>
            </div>

            {/* Step Counter */}
            <div className="flex flex-col space-y-2 justify-center">
              <div className="text-gray-300 text-sm">
                Step: {currentStep + 1} of {steps.length}
              </div>
              <div className="text-gray-300 text-sm">
                Subproblems: {subproblemCount.solved} solved, {subproblemCount.reused} reused
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Playback Controls */}
            <div className="flex space-x-2">
              <button 
                onClick={togglePlay}
                className="btn bg-green-600 hover:bg-green-700 border-none text-white"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button 
                onClick={stepBackward}
                className="btn bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
                disabled={currentStep === 0}
              >
                <StepBack size={20} />
                Step Back
              </button>
              <button 
                onClick={stepForward}
                className="btn bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
                disabled={currentStep === steps.length - 1}
              >
                <StepForward size={20} />
                Step Forward
              </button>
              <button 
                onClick={resetVisualization}
                className="btn bg-red-600 hover:bg-red-700 border-none text-white"
              >
                <RefreshCw size={20} />
                Reset
              </button>
            </div>

            {/* Speed Control */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-300">Speed:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={speed}
                onChange={(e) => {
                  setSpeed(parseInt(e.target.value));
                  if (isPlaying) {
                    clearInterval(animationInterval.current);
                    setIsPlaying(false);
                    togglePlay();
                  }
                }}
                className="range range-xs range-primary w-32"
              />
              <span className="text-gray-300 text-sm">
                {speed < 33 ? 'Slow' : speed < 66 ? 'Medium' : 'Fast'}
              </span>
            </div>
          </div>
        </div>

        {/* Visualization Area */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Visualization</h2>
          <div className="min-h-64 bg-gray-900/50 rounded-lg border border-gray-700 p-6">
            {mode === 'memoization' ? renderTree() : renderDPTable()}
          </div>
        </div>

        {/* Explanation and Code Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Explanation Panel */}
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Step Explanation</h2>
            <div className="h-64 overflow-y-auto bg-gray-900/50 rounded-lg p-4">
              <p className="text-gray-300 whitespace-pre-line">{explanation}</p>
            </div>
          </div>

          {/* Code Snippet Panel */}
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">
              {mode === 'memoization' ? 'Memoization Code' : 'Tabulation Code'}
            </h2>
            <div className="font-mono text-sm bg-gray-900/70 p-4 rounded-lg overflow-x-auto">
              {(mode === 'memoization' ? memoizationCode : tabulationCode).map((line, index) => (
                <div
                  key={index}
                  className={`py-1 px-2 ${activeLine === index ? 'bg-teal-900/50 text-cyan-300' : 'text-gray-300'}`}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Complexity Information */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Complexity Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Memoization</h3>
              <p className="text-gray-300">Time: O(n)</p>
              <p className="text-gray-300">Space: O(n)</p>
              <p className="text-sm text-gray-500 mt-2">(recursion stack + memo storage)</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Tabulation</h3>
              <p className="text-gray-300">Time: O(n)</p>
              <p className="text-gray-300">Space: O(n)</p>
              <p className="text-sm text-gray-500 mt-2">(DP table storage)</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Optimized</h3>
              <p className="text-gray-300">Time: O(n)</p>
              <p className="text-gray-300">Space: O(1)</p>
              <p className="text-sm text-gray-500 mt-2">(store only last two values)</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Visualization Legend</h2>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-600 mr-2"></div>
              <span className="text-gray-300">Current subproblem being computed</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-600 mr-2"></div>
              <span className="text-gray-300">Base case or already solved</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-purple-600 mr-2"></div>
              <span className="text-gray-300">Completed computation</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-yellow-400 mr-2"></div>
              <span className="text-gray-300">Memoized value reuse</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FibonacciDPVisualizer;