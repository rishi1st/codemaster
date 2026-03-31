import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, StepForward, StepBack, RefreshCw } from 'lucide-react';

const BinarySearch = () => {
  // State management
  const [array, setArray] = useState([]);
  const [target, setTarget] = useState('');
  const [searching, setSearching] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [speed, setSpeed] = useState(50);
  const [highlightMode, setHighlightMode] = useState('mid');
  const [comparisonCount, setComparisonCount] = useState(0);
  const [low, setLow] = useState(-1);
  const [mid, setMid] = useState(-1);
  const [high, setHigh] = useState(-1);
  const [foundIndex, setFoundIndex] = useState(-1);
  const [discardedIndices, setDiscardedIndices] = useState(new Set());
  const [customArrayInput, setCustomArrayInput] = useState('');
  const [arraySize, setArraySize] = useState(10);
  const [explanation, setExplanation] = useState('');
  const [codeSnippet] = useState([
    "function binarySearch(arr, target) {",
    "  let low = 0, high = arr.length - 1;",
    "  while (low <= high) {",
    "    let mid = Math.floor((low + high) / 2);",
    "    if (arr[mid] === target) {",
    "      return mid;",
    "    } else if (arr[mid] < target) {",
    "      low = mid + 1;",
    "    } else {",
    "      high = mid - 1;",
    "    }",
    "  }",
    "  return -1;",
    "}"
  ]);
  const [activeLine, setActiveLine] = useState(-1);

  // Refs
  const searchInterval = useRef(null);

  // Initialize array
  useEffect(() => {
    generateRandomSortedArray(arraySize);
  }, [arraySize]);

  // Generate random sorted array
  const generateRandomSortedArray = (size) => {
    const newArray = Array.from({ length: size }, () => 
      Math.floor(Math.random() * 100) + 1
    );
    newArray.sort((a, b) => a - b);
    setArray(newArray);
    resetSearch();
    setExplanation('Sorted array generated. Enter a target value and start searching.');
  };

  // Handle custom array input
  const handleCustomArray = () => {
    try {
      const newArray = customArrayInput.split(',')
        .map(num => parseInt(num.trim()))
        .filter(num => !isNaN(num));
      
      if (newArray.length < 2) {
        setExplanation('Please enter at least 2 numbers separated by commas.');
        return;
      }
      
      newArray.sort((a, b) => a - b);
      setArray(newArray);
      setArraySize(newArray.length);
      resetSearch();
      setExplanation('Custom sorted array loaded. Enter a target value and start searching.');
    } catch (error) {
      setExplanation('Invalid input. Please enter numbers separated by commas (e.g., 5, 3, 8, 1).');
    }
  };

  // Reset search
  const resetSearch = () => {
    clearInterval(searchInterval.current);
    setSearching(false);
    setCurrentStep(0);
    setSteps([]);
    setComparisonCount(0);
    setLow(-1);
    setMid(-1);
    setHigh(-1);
    setFoundIndex(-1);
    setDiscardedIndices(new Set());
    setActiveLine(-1);
  };

  // Generate steps for binary search
  const generateSteps = () => {
    if (!target || isNaN(target)) {
      setExplanation('Please enter a valid target number.');
      return [];
    }

    const targetNum = parseInt(target);
    const newSteps = [];
    let comparisons = 0;
    let lowVal = 0;
    let highVal = array.length - 1;
    let discarded = new Set();

    // Add initial state
    newSteps.push({
      array: [...array],
      low: lowVal,
      mid: -1,
      high: highVal,
      foundIndex: -1,
      discardedIndices: new Set(discarded),
      comparisons: comparisons,
      explanation: `Starting binary search for target ${targetNum}...`,
      line: 2
    });

    while (lowVal <= highVal) {
      const midVal = Math.floor((lowVal + highVal) / 2);
      comparisons++;
      
      // Calculate mid step
      newSteps.push({
        array: [...array],
        low: lowVal,
        mid: midVal,
        high: highVal,
        foundIndex: -1,
        discardedIndices: new Set(discarded),
        comparisons: comparisons,
        explanation: `Calculating mid = floor((${lowVal} + ${highVal}) / 2) = ${midVal}`,
        line: 4
      });

      // Compare step
      newSteps.push({
        array: [...array],
        low: lowVal,
        mid: midVal,
        high: highVal,
        foundIndex: -1,
        discardedIndices: new Set(discarded),
        comparisons: comparisons,
        explanation: `Compare target ${targetNum} with arr[${midVal}] = ${array[midVal]}`,
        line: 5
      });

      if (array[midVal] === targetNum) {
        // Found step
        newSteps.push({
          array: [...array],
          low: lowVal,
          mid: midVal,
          high: highVal,
          foundIndex: midVal,
          discardedIndices: new Set(discarded),
          comparisons: comparisons,
          explanation: `Found target ${targetNum} at index ${midVal}!`,
          line: 6
        });
        setSteps(newSteps);
        return newSteps;
      } else if (array[midVal] < targetNum) {
        // Target is in right half
        for (let i = lowVal; i <= midVal; i++) {
          discarded.add(i);
        }
        lowVal = midVal + 1;
        newSteps.push({
          array: [...array],
          low: lowVal,
          mid: midVal,
          high: highVal,
          foundIndex: -1,
          discardedIndices: new Set(discarded),
          comparisons: comparisons,
          explanation: `${targetNum} > arr[${midVal}] = ${array[midVal]} → search right half`,
          line: 8
        });
      } else {
        // Target is in left half
        for (let i = midVal; i <= highVal; i++) {
          discarded.add(i);
        }
        highVal = midVal - 1;
        newSteps.push({
          array: [...array],
          low: lowVal,
          mid: midVal,
          high: highVal,
          foundIndex: -1,
          discardedIndices: new Set(discarded),
          comparisons: comparisons,
          explanation: `${targetNum} < arr[${midVal}] = ${array[midVal]} → search left half`,
          line: 10
        });
      }
    }

    // Not found in entire array
    newSteps.push({
      array: [...array],
      low: -1,
      mid: -1,
      high: -1,
      foundIndex: -1,
      discardedIndices: new Set(Array.from({length: array.length}, (_, i) => i)),
      comparisons: comparisons,
      explanation: `Target ${targetNum} not found in the array.`,
      line: 12
    });

    setSteps(newSteps);
    return newSteps;
  };

  // Start searching
  const startSearching = () => {
    if (searching) {
      clearInterval(searchInterval.current);
      setSearching(false);
      return;
    }

    if (steps.length === 0 || currentStep === steps.length - 1) {
      const newSteps = generateSteps();
      if (newSteps.length === 0) return; // Invalid target
      setSteps(newSteps);
      setCurrentStep(0);
    }

    setSearching(true);
    searchInterval.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(searchInterval.current);
          setSearching(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 - speed * 10);
  };

  // Step forward
  const stepForward = () => {
    if (searching) {
      clearInterval(searchInterval.current);
      setSearching(false);
    }

    if (steps.length === 0) {
      const newSteps = generateSteps();
      if (newSteps.length === 0) return; // Invalid target
      setSteps(newSteps);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Step backward
  const stepBackward = () => {
    if (searching) {
      clearInterval(searchInterval.current);
      setSearching(false);
    }

    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Update state when current step changes
  useEffect(() => {
    if (steps.length > 0 && currentStep < steps.length) {
      const step = steps[currentStep];
      setLow(step.low);
      setMid(step.mid);
      setHigh(step.high);
      setFoundIndex(step.foundIndex);
      setDiscardedIndices(step.discardedIndices);
      setComparisonCount(step.comparisons);
      setExplanation(step.explanation);
      setActiveLine(step.line);
    }
  }, [currentStep, steps]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => clearInterval(searchInterval.current);
  }, []);

  // Calculate bar width based on array size
  const barWidth = Math.max(20, Math.min(50, 500 / array.length));

  return (
    <>
      {/* Header Section */}
      <div className="pt-22 mb-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Binary Search Algorithm</h1>
        <p className="text-lg text-gray-300">
          Binary Search repeatedly divides a sorted array in half to locate the target.
          <span className="ml-2 text-cyan-400">Time Complexity: O(log n), Space Complexity: O(1)</span>
        </p>
      </div>

      {/* Controls Section */}
      <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Input Array Options */}
          <div className="flex flex-col space-y-2">
            <label className="text-gray-300 text-sm">Enter custom sorted array (comma-separated):</label>
            <div className="flex">
              <input
                type="text"
                value={customArrayInput}
                onChange={(e) => setCustomArrayInput(e.target.value)}
                placeholder="e.g., 1, 3, 5, 8, 12"
                className="flex-grow input input-bordered bg-gray-700/50 border-gray-600 text-white placeholder-gray-500"
              />
              <button 
                onClick={handleCustomArray}
                className="ml-2 btn bg-blue-600 hover:bg-blue-700 border-none text-white"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-gray-300 text-sm">Generate random sorted array:</label>
            <div className="flex">
              <select
                value={arraySize}
                onChange={(e) => setArraySize(parseInt(e.target.value))}
                className="flex-grow select select-bordered bg-gray-700/50 border-gray-600 text-white"
              >
                <option value={5}>5 elements</option>
                <option value={10}>10 elements</option>
                <option value={20}>20 elements</option>
                <option value={50}>50 elements</option>
              </select>
              <button 
                onClick={() => generateRandomSortedArray(arraySize)}
                className="ml-2 btn bg-purple-600 hover:bg-purple-700 border-none text-white"
              >
                Generate
              </button>
            </div>
          </div>
        </div>

        {/* Target Input */}
        <div className="mb-4">
          <label className="text-gray-300 text-sm">Target value to search for:</label>
          <div className="flex">
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="flex-grow input input-bordered bg-gray-700/50 border-gray-600 text-white"
              placeholder="Enter target value"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Playback Controls */}
          <div className="flex space-x-2">
            <button 
              onClick={startSearching}
              className="btn bg-green-600 hover:bg-green-700 border-none text-white"
            >
              {searching ? <Pause size={20} /> : <Play size={20} />}
              {searching ? 'Pause' : 'Play'}
            </button>
            <button 
              onClick={stepBackward}
              className="btn bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
            >
              <StepBack size={20} />
              Step Back
            </button>
            <button 
              onClick={stepForward}
              className="btn bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
            >
              <StepForward size={20} />
              Step Forward
            </button>
            <button 
              onClick={resetSearch}
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
                if (searching) {
                  clearInterval(searchInterval.current);
                  setSearching(false);
                  startSearching();
                }
              }}
              className="range range-xs range-primary w-32"
            />
            <span className="text-gray-300 text-sm">
              {speed < 33 ? 'Slow' : speed < 66 ? 'Medium' : 'Fast'}
            </span>
          </div>

          {/* Highlight Mode Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-gray-300">Highlight:</span>
            <select
              value={highlightMode}
              onChange={(e) => setHighlightMode(e.target.value)}
              className="select select-bordered select-xs bg-gray-700/50 border-gray-600 text-white"
            >
              <option value="mid">Mid Element</option>
              <option value="range">Current Range</option>
              <option value="discarded">Discarded Elements</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats and Step Counter */}
      <div className="flex flex-wrap justify-between items-center mb-6 bg-gray-800/50 rounded-xl p-4 backdrop-blur-md">
        <div className="text-sm text-gray-300">
          <span className="mr-4">Step: {currentStep + 1} of {steps.length}</span>
          <span>Comparisons: {comparisonCount}</span>
        </div>
        
        <div className="flex items-center space-x-4 mt-2 md:mt-0">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
            <span className="text-xs text-gray-400">Mid</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
            <span className="text-xs text-gray-400">Range</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-500 mr-1"></div>
            <span className="text-xs text-gray-400">Discarded</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
            <span className="text-xs text-gray-400">Found</span>
          </div>
        </div>
      </div>

      {/* Visualization Area */}
      <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6 shadow-xl">
        <div className="flex items-end justify-center h-64" style={{ gap: '2px' }}>
          {array.map((value, index) => {
            let backgroundColor = 'bg-gray-600'; // Default
            
            if (foundIndex === index) {
              backgroundColor = 'bg-green-500'; // Found
            } else if (mid === index) {
              backgroundColor = 'bg-blue-500'; // Mid
            } else if (index >= low && index <= high) {
              backgroundColor = 'bg-yellow-500'; // Current range
            } else if (discardedIndices.has(index)) {
              backgroundColor = 'bg-gray-500'; // Discarded
            }
            
            return (
              <div
                key={index}
                className={`${backgroundColor} transition-all duration-300 flex items-end justify-center rounded-t-md`}
                style={{
                  height: `${value}%`,
                  width: `${barWidth}px`,
                  minWidth: '10px'
                }}
              >
                <span className="text-xs text-white -mb-6">{value}</span>
                <span className="absolute -bottom-6 text-xs text-gray-400">{index}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-8 flex justify-center text-gray-400 text-sm">
          {low >= 0 && high >= 0 && (
            <div className="flex items-center space-x-4">
              <div>Low: {low}</div>
              <div>Mid: {mid}</div>
              <div>High: {high}</div>
            </div>
          )}
        </div>
      </div>

      {/* Explanation and Code Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Explanation Panel */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Step Explanation</h2>
          <div className="h-32 overflow-y-auto">
            <p className="text-gray-300">{explanation}</p>
          </div>
        </div>

        {/* Code Snippet Panel */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Code Snippet</h2>
          <div className="font-mono text-sm bg-gray-900/70 p-4 rounded-lg overflow-x-auto">
            {codeSnippet.map((line, index) => (
              <div
                key={index}
                className={`py-1 px-2 ${activeLine === index ? 'bg-blue-900/50 text-cyan-300' : 'text-gray-300'}`}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Complexity Information */}
      <div className="mt-6 bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-white mb-4">Complexity Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <h3 className="text-lg text-cyan-400 mb-2">Time Complexity (Best)</h3>
            <p className="text-gray-300">O(1)</p>
            <p className="text-sm text-gray-500">When the target is the middle element</p>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <h3 className="text-lg text-cyan-400 mb-2">Time Complexity (Worst)</h3>
            <p className="text-gray-300">O(log n)</p>
            <p className="text-sm text-gray-500">When the target is at the beginning or end</p>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <h3 className="text-lg text-cyan-400 mb-2">Space Complexity</h3>
            <p className="text-gray-300">O(1)</p>
            <p className="text-sm text-gray-500">Uses only a constant amount of additional space</p>
          </div>
        </div>
        <div className="mt-4 text-sm text-yellow-400">
          ⚠️ Note: Binary Search requires the input array to be sorted.
        </div>
      </div>
    </>
  );
};

export default BinarySearch;