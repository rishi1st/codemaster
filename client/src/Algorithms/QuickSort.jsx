import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, StepForward, StepBack, RefreshCw, Code, Cpu, Brain, Zap, Sparkles, Github, Linkedin } from 'lucide-react';

const QuickSort = () => {
  // State management
  const [array, setArray] = useState([]);
  const [sorting, setSorting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [speed, setSpeed] = useState(50);
  const [highlightMode, setHighlightMode] = useState('pivot');
  const [comparisonCount, setComparisonCount] = useState(0);
  const [swapCount, setSwapCount] = useState(0);
  const [sortedIndices, setSortedIndices] = useState(new Set());
  const [pivotIndex, setPivotIndex] = useState(-1);
  const [leftPointer, setLeftPointer] = useState(-1);
  const [rightPointer, setRightPointer] = useState(-1);
  const [partitionIndices, setPartitionIndices] = useState([]);
  const [customArrayInput, setCustomArrayInput] = useState('');
  const [arraySize, setArraySize] = useState(10);
  const [explanation, setExplanation] = useState('');
  const [codeSnippet] = useState([
    "function quickSort(arr, low, high) {",
    "  if (low < high) {",
    "    const pi = partition(arr, low, high);",
    "    quickSort(arr, low, pi - 1);",
    "    quickSort(arr, pi + 1, high);",
    "  }",
    "}",
    "",
    "function partition(arr, low, high) {",
    "  const pivot = arr[high];",
    "  let i = low - 1;",
    "  for (let j = low; j < high; j++) {",
    "    if (arr[j] < pivot) {",
    "      i++;",
    "      [arr[i], arr[j]] = [arr[j], arr[i]];",
    "    }",
    "  }",
    "  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];",
    "  return i + 1;",
    "}"
  ]);
  const [activeLine, setActiveLine] = useState(-1);
  const [callStack, setCallStack] = useState([]);

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
    setPivotIndex(-1);
    setLeftPointer(-1);
    setRightPointer(-1);
    setPartitionIndices([]);
    setExplanation('Array generated. Ready to sort!');
    setActiveLine(-1);
    setCallStack([]);
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
      setPivotIndex(-1);
      setLeftPointer(-1);
      setRightPointer(-1);
      setPartitionIndices([]);
      setExplanation('Custom array loaded. Ready to sort!');
      setActiveLine(-1);
      setCallStack([]);
    } catch (error) {
      setExplanation('Invalid input. Please enter numbers separated by commas (e.g., 5, 3, 8, 1).');
    }
  };

  // Generate steps for quick sort
  const generateSteps = () => {
    const arr = [...array];
    const newSteps = [];
    let comparisons = 0;
    let swaps = 0;
    let sorted = new Set();
    let stack = [{ low: 0, high: arr.length - 1 }];

    // Add initial state
    newSteps.push({
      array: [...arr],
      pivotIndex: -1,
      leftPointer: -1,
      rightPointer: -1,
      partitionIndices: [],
      sortedIndices: new Set(sorted),
      comparisons: comparisons,
      swaps: swaps,
      callStack: [...stack],
      explanation: 'Starting quick sort...',
      line: 1
    });

    // Recursive function to generate steps
    const quickSortSteps = (low, high, depth = 0) => {
      if (low >= high) {
        if (low === high) {
          sorted.add(low);
          newSteps.push({
            array: [...arr],
            pivotIndex: -1,
            leftPointer: -1,
            rightPointer: -1,
            partitionIndices: [],
            sortedIndices: new Set(sorted),
            comparisons: comparisons,
            swaps: swaps,
            callStack: [...stack],
            explanation: `Base case: Single element at index ${low} is already sorted.`,
            line: 2
          });
        }
        return;
      }

      // Partition process
      const pivot = arr[high];
      let i = low - 1;

      // Set pivot step
      newSteps.push({
        array: [...arr],
        pivotIndex: high,
        leftPointer: -1,
        rightPointer: -1,
        partitionIndices: [low, high],
        sortedIndices: new Set(sorted),
        comparisons: comparisons,
        swaps: swaps,
        callStack: [...stack],
        explanation: `Selecting pivot: ${pivot} at index ${high}. Partitioning from ${low} to ${high}.`,
        line: 9
      });

      for (let j = low; j < high; j++) {
        // Comparison step
        comparisons++;
        newSteps.push({
          array: [...arr],
          pivotIndex: high,
          leftPointer: i,
          rightPointer: j,
          partitionIndices: [low, high],
          sortedIndices: new Set(sorted),
          comparisons: comparisons,
          swaps: swaps,
          callStack: [...stack],
          explanation: `Comparing ${arr[j]} at index ${j} with pivot ${pivot}.`,
          line: 12
        });

        if (arr[j] < pivot) {
          i++;
          
          // Swap step if needed
          if (i !== j) {
            [arr[i], arr[j]] = [arr[j], arr[i]];
            swaps++;
            newSteps.push({
              array: [...arr],
              pivotIndex: high,
              leftPointer: i,
              rightPointer: j,
              partitionIndices: [low, high],
              sortedIndices: new Set(sorted),
              comparisons: comparisons,
              swaps: swaps,
              callStack: [...stack],
              explanation: `Swapping ${arr[i]} at index ${i} with ${arr[j]} at index ${j}.`,
              line: 14
            });
          } else {
            newSteps.push({
              array: [...arr],
              pivotIndex: high,
              leftPointer: i,
              rightPointer: j,
              partitionIndices: [low, high],
              sortedIndices: new Set(sorted),
              comparisons: comparisons,
              swaps: swaps,
              callStack: [...stack],
              explanation: `No swap needed. Moving pointer i to ${i}.`,
              line: 13
            });
          }
        }
      }

      // Final swap to place pivot in correct position
      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      swaps++;
      const pivotPos = i + 1;
      sorted.add(pivotPos);
      
      newSteps.push({
        array: [...arr],
        pivotIndex: pivotPos,
        leftPointer: -1,
        rightPointer: -1,
        partitionIndices: [],
        sortedIndices: new Set(sorted),
        comparisons: comparisons,
        swaps: swaps,
        callStack: [...stack],
        explanation: `Placing pivot ${pivot} at correct position ${pivotPos}.`,
        line: 17
      });

      // Recursive calls
      if (low < pivotPos - 1) {
        stack.push({ low: low, high: pivotPos - 1 });
        newSteps.push({
          array: [...arr],
          pivotIndex: -1,
          leftPointer: -1,
          rightPointer: -1,
          partitionIndices: [low, pivotPos - 1],
          sortedIndices: new Set(sorted),
          comparisons: comparisons,
          swaps: swaps,
          callStack: [...stack],
          explanation: `Recursively sorting left partition: indices ${low} to ${pivotPos - 1}.`,
          line: 4
        });
        
        quickSortSteps(low, pivotPos - 1, depth + 1);
        stack.pop();
      }

      if (pivotPos + 1 < high) {
        stack.push({ low: pivotPos + 1, high: high });
        newSteps.push({
          array: [...arr],
          pivotIndex: -1,
          leftPointer: -1,
          rightPointer: -1,
          partitionIndices: [pivotPos + 1, high],
          sortedIndices: new Set(sorted),
          comparisons: comparisons,
          swaps: swaps,
          callStack: [...stack],
          explanation: `Recursively sorting right partition: indices ${pivotPos + 1} to ${high}.`,
          line: 5
        });
        
        quickSortSteps(pivotPos + 1, high, depth + 1);
        stack.pop();
      }
    };

    // Start the recursive process
    quickSortSteps(0, arr.length - 1);

    // Final sorted state
    newSteps.push({
      array: [...arr],
      pivotIndex: -1,
      leftPointer: -1,
      rightPointer: -1,
      partitionIndices: [],
      sortedIndices: new Set(Array.from({length: arr.length}, (_, i) => i)),
      comparisons: comparisons,
      swaps: swaps,
      callStack: [],
      explanation: 'Array is completely sorted!',
      line: 18
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
    setPivotIndex(-1);
    setLeftPointer(-1);
    setRightPointer(-1);
    setPartitionIndices([]);
    setExplanation('Reset to initial state. Ready to sort!');
    setActiveLine(-1);
    setCallStack([]);
  };

  // Update state when current step changes
  useEffect(() => {
    if (steps.length > 0 && currentStep < steps.length) {
      const step = steps[currentStep];
      setArray(step.array);
      setComparisonCount(step.comparisons);
      setSwapCount(step.swaps);
      setSortedIndices(step.sortedIndices);
      setPivotIndex(step.pivotIndex);
      setLeftPointer(step.leftPointer);
      setRightPointer(step.rightPointer);
      setPartitionIndices(step.partitionIndices || []);
      setCallStack(step.callStack || []);
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
          <h1 className="text-4xl font-bold text-white mb-2">Quick Sort Algorithm</h1>
          <p className="text-lg text-gray-300">
            Quick Sort is a divide-and-conquer algorithm that selects a pivot element and partitions the array around it.
            <span className="ml-2 text-cyan-400">Complexity: O(n log n) average, O(n²) worst-case</span>
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
                <option value="pivot">Pivot Element</option>
                <option value="pointers">Pointers</option>
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
              <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
              <span className="text-xs text-gray-400">Pivot</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
              <span className="text-xs text-gray-400">Left Pointer</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
              <span className="text-xs text-gray-400">Right Pointer</span>
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
              } else if (pivotIndex === index) {
                backgroundColor = 'bg-purple-500'; // Pivot
              } else if (leftPointer === index) {
                backgroundColor = 'bg-blue-500'; // Left pointer
              } else if (rightPointer === index) {
                backgroundColor = 'bg-orange-500'; // Right pointer
              } else if (partitionIndices.length === 2 && index >= partitionIndices[0] && index <= partitionIndices[1]) {
                backgroundColor = 'bg-yellow-500'; // Current partition
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

          {/* Call Stack Visualization */}
          {callStack.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-white mb-4">Call Stack</h2>
              <div className="overflow-x-auto">
                <div className="flex space-x-2 min-w-max">
                  {callStack.map((call, index) => (
                    <div 
                      key={index}
                      className="px-3 py-2 bg-gray-700/50 rounded-lg text-white"
                    >
                      {`[${call.low}, ${call.high}]`}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
              <p className="text-sm text-gray-500">When pivot divides array evenly</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Time Complexity (Worst)</h3>
              <p className="text-gray-300">O(n²)</p>
              <p className="text-sm text-gray-500">When pivot is smallest or largest element</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Space Complexity</h3>
              <p className="text-gray-300">O(log n)</p>
              <p className="text-sm text-gray-500">Due to recursive call stack</p>
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

export default QuickSort;