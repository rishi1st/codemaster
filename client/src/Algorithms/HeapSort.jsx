import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, StepForward, StepBack, RefreshCw, Code, Cpu, Brain, Zap, Sparkles, Github, Linkedin } from 'lucide-react';

const HeapSort = () => {
  // State management
  const [array, setArray] = useState([]);
  const [sorting, setSorting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [speed, setSpeed] = useState(50);
  const [highlightMode, setHighlightMode] = useState('heapify');
  const [comparisonCount, setComparisonCount] = useState(0);
  const [swapCount, setSwapCount] = useState(0);
  const [sortedIndices, setSortedIndices] = useState(new Set());
  const [heapIndices, setHeapIndices] = useState(new Set());
  const [comparingIndices, setComparingIndices] = useState([]);
  const [swappingIndices, setSwappingIndices] = useState([]);
  const [customArrayInput, setCustomArrayInput] = useState('');
  const [arraySize, setArraySize] = useState(10);
  const [explanation, setExplanation] = useState('');
  const [codeSnippet] = useState([
    "function heapSort(arr) {",
    "  let n = arr.length;",
    "  // Build max heap",
    "  for (let i = Math.floor(n/2)-1; i >= 0; i--) {",
    "    heapify(arr, n, i);",
    "  }",
    "  // Extract elements from heap",
    "  for (let i = n-1; i > 0; i--) {",
    "    [arr[0], arr[i]] = [arr[i], arr[0]];",
    "    heapify(arr, i, 0);",
    "  }",
    "  return arr;",
    "}",
    "",
    "function heapify(arr, n, i) {",
    "  let largest = i;",
    "  let left = 2*i + 1;",
    "  let right = 2*i + 2;",
    "  if (left < n && arr[left] > arr[largest]) {",
    "    largest = left;",
    "  }",
    "  if (right < n && arr[right] > arr[largest]) {",
    "    largest = right;",
    "  }",
    "  if (largest !== i) {",
    "    [arr[i], arr[largest]] = [arr[largest], arr[i]];",
    "    heapify(arr, n, largest);",
    "  }",
    "}"
  ]);
  const [activeLine, setActiveLine] = useState(-1);
  const [heapTree, setHeapTree] = useState([]);

  // Refs
  const sortingInterval = useRef(null);

  // Initialize array
  useEffect(() => {
    generateRandomArray(arraySize);
  }, [arraySize]);

  // Generate random array
  const generateRandomArray = (size) => {
    const newArray = Array.from({ length: size }, () => 
      Math.floor(Math.random() * 100) + 5
    );
    setArray(newArray);
    setCurrentStep(0);
    setSteps([]);
    setComparisonCount(0);
    setSwapCount(0);
    setSortedIndices(new Set());
    setHeapIndices(new Set());
    setComparingIndices([]);
    setSwappingIndices([]);
    setExplanation('Array generated. Ready to build max heap!');
    setActiveLine(-1);
    setHeapTree([]);
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
      setCurrentStep(0);
      setSteps([]);
      setComparisonCount(0);
      setSwapCount(0);
      setSortedIndices(new Set());
      setHeapIndices(new Set());
      setComparingIndices([]);
      setSwappingIndices([]);
      setExplanation('Custom array loaded. Ready to build max heap!');
      setActiveLine(-1);
      setHeapTree([]);
    } catch (error) {
      setExplanation('Invalid input. Please enter numbers separated by commas (e.g., 5, 3, 8, 1).');
    }
  };

  // Generate steps for heap sort
  const generateSteps = () => {
    const arr = [...array];
    const n = arr.length;
    const newSteps = [];
    let comparisons = 0;
    let swaps = 0;
    let sorted = new Set();
    let heap = new Set(Array.from({length: n}, (_, i) => i));
    let tree = [];

    // Add initial state
    newSteps.push({
      array: [...arr],
      comparingIndices: [],
      swappingIndices: [],
      heapIndices: new Set(heap),
      sortedIndices: new Set(sorted),
      comparisons: comparisons,
      swaps: swaps,
      heapTree: [...tree],
      explanation: 'Starting heap sort. Building max heap...',
      line: 2
    });

    // Build max heap
    for (let i = Math.floor(n/2)-1; i >= 0; i--) {
      tree.push({ type: 'heapify', index: i, value: arr[i] });
      newSteps.push({
        array: [...arr],
        comparingIndices: [],
        swappingIndices: [],
        heapIndices: new Set(heap),
        sortedIndices: new Set(sorted),
        comparisons: comparisons,
        swaps: swaps,
        heapTree: [...tree],
        explanation: `Heapifying subtree rooted at index ${i} (value: ${arr[i]}).`,
        line: 5
      });
      
      // Heapify process for node i
      let current = i;
      let heapifySteps = [];
      
      while (true) {
        let largest = current;
        let left = 2 * current + 1;
        let right = 2 * current + 2;

        // Compare with left child
        if (left < n) {
          comparisons++;
          heapifySteps.push({
            array: [...arr],
            comparingIndices: [current, left],
            swappingIndices: [],
            heapIndices: new Set(heap),
            sortedIndices: new Set(sorted),
            comparisons: comparisons,
            swaps: swaps,
            heapTree: [...tree],
            explanation: `Comparing ${arr[current]} at index ${current} with left child ${arr[left]} at index ${left}.`,
            line: 16
          });

          if (arr[left] > arr[largest]) {
            largest = left;
          }
        }

        // Compare with right child
        if (right < n) {
          comparisons++;
          heapifySteps.push({
            array: [...arr],
            comparingIndices: [current, right],
            swappingIndices: [],
            heapIndices: new Set(heap),
            sortedIndices: new Set(sorted),
            comparisons: comparisons,
            swaps: swaps,
            heapTree: [...tree],
            explanation: `Comparing ${arr[current]} at index ${current} with right child ${arr[right]} at index ${right}.`,
            line: 19
          });

          if (arr[right] > arr[largest]) {
            largest = right;
          }
        }

        // If largest is not the current node, swap and continue
        if (largest !== current) {
          [arr[current], arr[largest]] = [arr[largest], arr[current]];
          swaps++;
          heapifySteps.push({
            array: [...arr],
            comparingIndices: [],
            swappingIndices: [current, largest],
            heapIndices: new Set(heap),
            sortedIndices: new Set(sorted),
            comparisons: comparisons,
            swaps: swaps,
            heapTree: [...tree],
            explanation: `Swapping ${arr[largest]} at index ${largest} with ${arr[current]} at index ${current}.`,
            line: 22
          });

          current = largest;
        } else {
          break;
        }
      }
      
      newSteps.push(...heapifySteps);
    }

    newSteps.push({
      array: [...arr],
      comparingIndices: [],
      swappingIndices: [],
      heapIndices: new Set(heap),
      sortedIndices: new Set(sorted),
      comparisons: comparisons,
      swaps: swaps,
      heapTree: [...tree],
      explanation: 'Max heap built. Starting extraction phase...',
      line: 8
    });

    // Extract elements from heap
    for (let i = n-1; i > 0; i--) {
      // Move current root to end
      [arr[0], arr[i]] = [arr[i], arr[0]];
      swaps++;
      sorted.add(i);
      heap.delete(i);
      
      newSteps.push({
        array: [...arr],
        comparingIndices: [],
        swappingIndices: [0, i],
        heapIndices: new Set(heap),
        sortedIndices: new Set(sorted),
        comparisons: comparisons,
        swaps: swaps,
        heapTree: [...tree],
        explanation: `Moving root ${arr[i]} to sorted position at index ${i}.`,
        line: 9
      });

      // Heapify the reduced heap
      let current = 0;
      let heapifySteps = [];
      
      while (true) {
        let largest = current;
        let left = 2 * current + 1;
        let right = 2 * current + 2;

        // Compare with left child
        if (left < i) {
          comparisons++;
          heapifySteps.push({
            array: [...arr],
            comparingIndices: [current, left],
            swappingIndices: [],
            heapIndices: new Set(heap),
            sortedIndices: new Set(sorted),
            comparisons: comparisons,
            swaps: swaps,
            heapTree: [...tree],
            explanation: `Comparing ${arr[current]} at index ${current} with left child ${arr[left]} at index ${left}.`,
            line: 16
          });

          if (arr[left] > arr[largest]) {
            largest = left;
          }
        }

        // Compare with right child
        if (right < i) {
          comparisons++;
          heapifySteps.push({
            array: [...arr],
            comparingIndices: [current, right],
            swappingIndices: [],
            heapIndices: new Set(heap),
            sortedIndices: new Set(sorted),
            comparisons: comparisons,
            swaps: swaps,
            heapTree: [...tree],
            explanation: `Comparing ${arr[current]} at index ${current} with right child ${arr[right]} at index ${right}.`,
            line: 19
          });

          if (arr[right] > arr[largest]) {
            largest = right;
          }
        }

        // If largest is not the current node, swap and continue
        if (largest !== current) {
          [arr[current], arr[largest]] = [arr[largest], arr[current]];
          swaps++;
          heapifySteps.push({
            array: [...arr],
            comparingIndices: [],
            swappingIndices: [current, largest],
            heapIndices: new Set(heap),
            sortedIndices: new Set(sorted),
            comparisons: comparisons,
            swaps: swaps,
            heapTree: [...tree],
            explanation: `Swapping ${arr[largest]} at index ${largest} with ${arr[current]} at index ${current}.`,
            line: 22
          });

          current = largest;
        } else {
          break;
        }
      }
      
      newSteps.push(...heapifySteps);
    }

    // Final sorted state
    sorted.add(0);
    newSteps.push({
      array: [...arr],
      comparingIndices: [],
      swappingIndices: [],
      heapIndices: new Set(),
      sortedIndices: new Set(Array.from({length: n}, (_, i) => i)),
      comparisons: comparisons,
      swaps: swaps,
      heapTree: [],
      explanation: 'Array is completely sorted!',
      line: 12
    });

    setSteps(newSteps);
    return newSteps;
  };

  // Start sorting
  const startSorting = () => {
    if (sorting) {
      clearInterval(sortingInterval.current);
      setSorting(false);
      return;
    }

    if (steps.length === 0 || currentStep === steps.length - 1) {
      const newSteps = generateSteps();
      setSteps(newSteps);
      setCurrentStep(0);
    }

    setSorting(true);
    sortingInterval.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(sortingInterval.current);
          setSorting(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 - speed * 10);
  };

  // Step forward
  const stepForward = () => {
    if (sorting) {
      clearInterval(sortingInterval.current);
      setSorting(false);
    }

    if (steps.length === 0) {
      const newSteps = generateSteps();
      setSteps(newSteps);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Step backward
  const stepBackward = () => {
    if (sorting) {
      clearInterval(sortingInterval.current);
      setSorting(false);
    }

    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Reset sorting
  const resetSorting = () => {
    clearInterval(sortingInterval.current);
    setSorting(false);
    setCurrentStep(0);
    setSteps([]);
    setComparisonCount(0);
    setSwapCount(0);
    setSortedIndices(new Set());
    setHeapIndices(new Set());
    setComparingIndices([]);
    setSwappingIndices([]);
    setExplanation('Reset to initial state. Ready to build max heap!');
    setActiveLine(-1);
    setHeapTree([]);
  };

  // Update state when current step changes
  useEffect(() => {
    if (steps.length > 0 && currentStep < steps.length) {
      const step = steps[currentStep];
      setArray(step.array);
      setComparisonCount(step.comparisons);
      setSwapCount(step.swaps);
      setSortedIndices(step.sortedIndices);
      setHeapIndices(step.heapIndices);
      setComparingIndices(step.comparingIndices || []);
      setSwappingIndices(step.swappingIndices || []);
      setHeapTree(step.heapTree || []);
      setExplanation(step.explanation);
      setActiveLine(step.line);
    }
  }, [currentStep, steps]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => clearInterval(sortingInterval.current);
  }, []);

  // Calculate bar width based on array size
  const barWidth = Math.max(20, Math.min(50, 500 / array.length));

  // Function to render heap tree visualization
  const renderHeapTree = () => {
    if (heapTree.length === 0) return null;

    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-white mb-2">Heap Structure</h3>
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <div className="flex flex-col items-center">
            {heapTree.map((node, index) => (
              <div key={index} className="mb-2 p-2 bg-blue-900/30 rounded">
                <span className="text-white">Heapifying: {node.value} at index {node.index}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-22 min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6 overflow-x-hidden relative">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-blue-500/10 animate-pulse"
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
        
        {/* Binary rain animation */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-green-400/30 text-xs animate-drop"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`
              }}
            >
              {Math.random() > 0.5 ? '1' : '0'}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Heap Sort Algorithm</h1>
          <p className="text-lg text-gray-300">
            Heap Sort is a comparison-based sorting algorithm that uses a binary heap data structure.
            <span className="ml-2 text-cyan-400">Complexity: O(n log n)</span>
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

          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Playback Controls */}
            <div className="flex space-x-2">
              <button 
                onClick={startSorting}
                className="btn bg-green-600 hover:bg-green-700 border-none text-white"
              >
                {sorting ? <Pause size={20} /> : <Play size={20} />}
                {sorting ? 'Pause' : 'Play'}
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
                onClick={resetSorting}
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
                  if (sorting) {
                    clearInterval(sortingInterval.current);
                    setSorting(false);
                    startSorting();
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
                <option value="heapify">Heapify Process</option>
                <option value="comparisons">Comparisons</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats and Step Counter */}
        <div className="flex flex-wrap justify-between items-center mb-6 bg-gray-800/50 rounded-xl p-4 backdrop-blur-md">
          <div className="text-sm text-gray-300">
            <span className="mr-4">Step: {currentStep + 1} of {steps.length}</span>
            <span className="mr-4">Comparisons: {comparisonCount}</span>
            <span>Swaps: {swapCount}</span>
          </div>
          
          <div className="flex items-center space-x-4 mt-2 md:mt-0">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
              <span className="text-xs text-gray-400">Comparing</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
              <span className="text-xs text-gray-400">Swapping</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
              <span className="text-xs text-gray-400">Heap Element</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
              <span className="text-xs text-gray-400">Sorted</span>
            </div>
          </div>
        </div>

        {/* Visualization Area */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Array Visualization</h2>
          <div className="flex items-end justify-center h-64" style={{ gap: '2px' }}>
            {array.map((value, index) => {
              let backgroundColor = 'bg-gray-600'; // Default
              
              if (sortedIndices.has(index)) {
                backgroundColor = 'bg-green-500'; // Sorted
              } else if (heapIndices.has(index)) {
                backgroundColor = 'bg-yellow-500'; // In heap
              } else if (comparingIndices.includes(index)) {
                backgroundColor = 'bg-blue-500'; // Comparing
              } else if (swappingIndices.includes(index)) {
                backgroundColor = 'bg-red-500'; // Swapping
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
                </div>
              );
            })}
          </div>

          {/* Heap Tree Visualization */}
          {renderHeapTree()}
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
              <p className="text-gray-300">O(n log n)</p>
              <p className="text-sm text-gray-500">Same as worst case</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Time Complexity (Worst)</h3>
              <p className="text-gray-300">O(n log n)</p>
              <p className="text-sm text-gray-500">Guaranteed performance</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Space Complexity</h3>
              <p className="text-gray-300">O(1)</p>
              <p className="text-sm text-gray-500">Sorts in-place with minimal extra space</p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes drop {
          0% {
            transform: translateY(-100px);
            opacity: 0;
          }
          10% {
            opacity: 0.5;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
        .animate-drop {
          animation: drop linear infinite;
        }
      `}</style>
    </div>
  );
};

export default HeapSort;