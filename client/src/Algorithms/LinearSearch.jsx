import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, StepForward, StepBack, RefreshCw } from 'lucide-react';

const LinearSearch = () => {
  // State management
  const [array, setArray] = useState([]);
  const [target, setTarget] = useState('');
  const [searching, setSearching] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [speed, setSpeed] = useState(50);
  const [highlightMode, setHighlightMode] = useState('current');
  const [comparisonCount, setComparisonCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [foundIndex, setFoundIndex] = useState(-1);
  const [checkedIndices, setCheckedIndices] = useState(new Set());
  const [customArrayInput, setCustomArrayInput] = useState('');
  const [arraySize, setArraySize] = useState(10);
  const [explanation, setExplanation] = useState('');
  const [codeSnippet] = useState([
    "function linearSearch(arr, target) {",
    "  for (let i = 0; i < arr.length; i++) {",
    "    if (arr[i] === target) {",
    "      return i;",
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
    generateRandomArray(arraySize);
  }, [arraySize]);

  // Generate random array
  const generateRandomArray = (size) => {
    const newArray = Array.from({ length: size }, () => 
      Math.floor(Math.random() * 100) + 1
    );
    setArray(newArray);
    resetSearch();
    setExplanation('Array generated. Enter a target value and start searching.');
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
      
      setArray(newArray);
      setArraySize(newArray.length);
      resetSearch();
      setExplanation('Custom array loaded. Enter a target value and start searching.');
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
    setCurrentIndex(-1);
    setFoundIndex(-1);
    setCheckedIndices(new Set());
    setActiveLine(-1);
  };

  // Generate steps for linear search
  const generateSteps = () => {
    if (!target || isNaN(target)) {
      setExplanation('Please enter a valid target number.');
      return [];
    }

    const targetNum = parseInt(target);
    const newSteps = [];
    let comparisons = 0;
    let checked = new Set();

    // Add initial state
    newSteps.push({
      array: [...array],
      currentIndex: -1,
      foundIndex: -1,
      checkedIndices: new Set(checked),
      comparisons: comparisons,
      explanation: `Starting linear search for target ${targetNum}...`,
      line: 1
    });

    for (let i = 0; i < array.length; i++) {
      comparisons++;
      checked.add(i);
      
      // Compare step
      newSteps.push({
        array: [...array],
        currentIndex: i,
        foundIndex: -1,
        checkedIndices: new Set(checked),
        comparisons: comparisons,
        explanation: `Step ${i+1}: Compare target ${targetNum} with arr[${i}] = ${array[i]}`,
        line: 2
      });

      if (array[i] === targetNum) {
        // Found step
        newSteps.push({
          array: [...array],
          currentIndex: i,
          foundIndex: i,
          checkedIndices: new Set(checked),
          comparisons: comparisons,
          explanation: `Found target ${targetNum} at index ${i}!`,
          line: 3
        });
        setSteps(newSteps);
        return newSteps;
      } else {
        // Not found step
        newSteps.push({
          array: [...array],
          currentIndex: i,
          foundIndex: -1,
          checkedIndices: new Set(checked),
          comparisons: comparisons,
          explanation: `Target ${targetNum} ≠ arr[${i}] = ${array[i]} → Continue searching`,
          line: 2
        });
      }
    }

    // Not found in entire array
    newSteps.push({
      array: [...array],
      currentIndex: -1,
      foundIndex: -1,
      checkedIndices: new Set(checked),
      comparisons: comparisons,
      explanation: `Target ${targetNum} not found in the array.`,
      line: 6
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
      setCurrentIndex(step.currentIndex);
      setFoundIndex(step.foundIndex);
      setCheckedIndices(step.checkedIndices);
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
        <h1 className="text-4xl font-bold text-white mb-2">Linear Search Algorithm</h1>
        <p className="text-lg text-gray-300">
          Linear Search checks each element of the array one by one until the target is found or the array ends.
          <span className="ml-2 text-cyan-400">Time Complexity: O(n), Space Complexity: O(1)</span>
        </p>
      </div>

      {/* Controls Section */}
      <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Input Array Options */}
          <div className="flex flex-col space-y-2">
            <label className="text-gray-300 text-sm">Enter custom array (comma-separated):</label>
            <div className="flex">
              <input
                type="text"
                value={customArrayInput}
                onChange={(e) => setCustomArrayInput(e.target.value)}
                placeholder="e.g., 5, 3, 8, 1, 2"
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
            <label className="text-gray-300 text-sm">Generate random array:</label>
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
                onClick={() => generateRandomArray(arraySize)}
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
              <option value="current">Current Element</option>
              <option value="checked">Checked Elements</option>
              <option value="both">Both</option>
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
            <span className="text-xs text-gray-400">Current</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-500 mr-1"></div>
            <span className="text-xs text-gray-400">Checked</span>
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
            } else if (currentIndex === index) {
              backgroundColor = 'bg-blue-500'; // Current
            } else if (
              (highlightMode === 'checked' || highlightMode === 'both') && 
              checkedIndices.has(index)
            ) {
              backgroundColor = 'bg-gray-500'; // Checked
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
            <p className="text-sm text-gray-500">When the target is the first element</p>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <h3 className="text-lg text-cyan-400 mb-2">Time Complexity (Worst)</h3>
            <p className="text-gray-300">O(n)</p>
            <p className="text-sm text-gray-500">When the target is the last element or not present</p>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <h3 className="text-lg text-cyan-400 mb-2">Space Complexity</h3>
            <p className="text-gray-300">O(1)</p>
            <p className="text-sm text-gray-500">Uses only a constant amount of additional space</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LinearSearch;