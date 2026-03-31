import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, StepForward, StepBack, RefreshCw, ArrowUp, ArrowDown, Eye, Search } from 'lucide-react';

const StackVisualizer = () => {
  // State management
  const [stack, setStack] = useState([]);
  const [stackSize, setStackSize] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [speed, setSpeed] = useState(50);
  const [explanation, setExplanation] = useState('');
  const [activeLine, setActiveLine] = useState(-1);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [operationType, setOperationType] = useState('');
  const [pushValue, setPushValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [topValue, setTopValue] = useState(null);
  const [isStackEmpty, setIsStackEmpty] = useState(true);
  const [isStackFull, setIsStackFull] = useState(false);
  const [foundIndex, setFoundIndex] = useState(-1);

  // Refs
  const animationInterval = useRef(null);

  // Initialize stack
  const initializeStack = useCallback(() => {
    const initialStack = Array(stackSize).fill(null);
    setStack(initialStack);
    setTopValue(null);
    setIsStackEmpty(true);
    setIsStackFull(false);
    setExplanation(`Stack initialized with capacity ${stackSize}`);
    resetVisualization();
  }, [stackSize]);

  // Update stack status
  useEffect(() => {
    const filledSlots = stack.filter(item => item !== null).length;
    setIsStackEmpty(filledSlots === 0);
    setIsStackFull(filledSlots === stackSize);
    
    // Find top value
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i] !== null) {
        setTopValue(stack[i]);
        return;
      }
    }
    setTopValue(null);
  }, [stack, stackSize]);

  // Generate steps for operations
  const generateOperationSteps = (operation, value) => {
    const newSteps = [];
    let currentStack = [...stack];
    const currentTopIndex = getTopIndex(currentStack);

    switch (operation) {
      case 'push':
        if (isStackFull) {
          setExplanation('Stack Overflow! Cannot push to full stack.');
          return [];
        }

        // Step 1: Find next available position
        const pushIndex = currentTopIndex + 1;
        newSteps.push({
          type: 'push_prepare',
          stack: [...currentStack],
          explanation: `Preparing to push ${value} onto the stack. Next available position: index ${pushIndex}`,
          highlightedIndex: -1,
          line: 0,
          topIndex: currentTopIndex
        });

        // Step 2: Push the value
        currentStack[pushIndex] = value;
        newSteps.push({
          type: 'push',
          stack: [...currentStack],
          explanation: `Pushed ${value} onto the stack. New top is at index ${pushIndex}`,
          highlightedIndex: pushIndex,
          line: 1,
          topIndex: pushIndex
        });

        setOperationType('push');
        break;

      case 'pop':
        if (isStackEmpty) {
          setExplanation('Stack Underflow! Cannot pop from empty stack.');
          return [];
        }

        const popIndex = currentTopIndex;
        const popValue = currentStack[popIndex];

        // Step 1: Highlight element to pop
        newSteps.push({
          type: 'pop_mark',
          stack: [...currentStack],
          explanation: `Preparing to pop from stack. Top element is ${popValue} at index ${popIndex}`,
          highlightedIndex: popIndex,
          line: 2,
          topIndex: popIndex
        });

        // Step 2: Remove the element
        currentStack[popIndex] = null;
        newSteps.push({
          type: 'pop',
          stack: [...currentStack],
          explanation: `Popped ${popValue} from the stack. ${popIndex > 0 ? `New top is at index ${popIndex - 1}` : 'Stack is now empty'}`,
          highlightedIndex: -1,
          line: 3,
          topIndex: Math.max(-1, popIndex - 1)
        });

        setOperationType('pop');
        break;

      case 'peek':
        if (isStackEmpty) {
          setExplanation('Stack is empty! Cannot peek.');
          return [];
        }

        newSteps.push({
          type: 'peek',
          stack: [...currentStack],
          explanation: `Peek operation. Top element is ${currentStack[currentTopIndex]} at index ${currentTopIndex}`,
          highlightedIndex: currentTopIndex,
          line: 4,
          topIndex: currentTopIndex
        });

        setOperationType('peek');
        break;

      case 'search':
        let found = -1;
        for (let i = currentTopIndex; i >= 0; i--) {
          newSteps.push({
            type: 'search_compare',
            stack: [...currentStack],
            explanation: `Searching for ${value}... Checking index ${i}: ${currentStack[i]}`,
            highlightedIndex: i,
            line: 5,
            topIndex: currentTopIndex,
            foundIndex: -1
          });

          if (currentStack[i] === value) {
            found = i;
            newSteps.push({
              type: 'search_found',
              stack: [...currentStack],
              explanation: `Found ${value} at position ${currentTopIndex - i + 1} from top (index ${i})!`,
              highlightedIndex: i,
              line: 6,
              topIndex: currentTopIndex,
              foundIndex: i
            });
            break;
          }
        }

        if (found === -1) {
          newSteps.push({
            type: 'search_not_found',
            stack: [...currentStack],
            explanation: `${value} not found in the stack`,
            highlightedIndex: -1,
            line: 7,
            topIndex: currentTopIndex,
            foundIndex: -1
          });
        }

        setOperationType('search');
        break;

      case 'traverse':
        if (isStackEmpty) {
          setExplanation('Stack is empty! Nothing to traverse.');
          return [];
        }

        for (let i = currentTopIndex; i >= 0; i--) {
          newSteps.push({
            type: 'traverse',
            stack: [...currentStack],
            explanation: `Traversing: Position ${currentTopIndex - i + 1} from top - Value: ${currentStack[i]} (Index: ${i})`,
            highlightedIndex: i,
            line: 8,
            topIndex: currentTopIndex,
            foundIndex: -1
          });
        }

        newSteps.push({
          type: 'traverse_complete',
          stack: [...currentStack],
          explanation: `Traversal complete. Stack has ${currentTopIndex + 1} elements.`,
          highlightedIndex: -1,
          line: 9,
          topIndex: currentTopIndex,
          foundIndex: -1
        });

        setOperationType('traverse');
        break;

      default:
        return [];
    }

    return newSteps;
  };

  // Helper function to get top index
  const getTopIndex = (currentStack) => {
    for (let i = currentStack.length - 1; i >= 0; i--) {
      if (currentStack[i] !== null) {
        return i;
      }
    }
    return -1;
  };

  // Operation handlers
  const handlePush = () => {
    const value = parseInt(pushValue);
    
    if (isNaN(value)) {
      setExplanation('Please enter a valid number to push');
      return;
    }

    const newSteps = generateOperationSteps('push', value);
    if (newSteps.length > 0) {
      setSteps(newSteps);
      setCurrentStep(0);
      setIsPlaying(false);
      setPushValue('');
    }
  };

  const handlePop = () => {
    const newSteps = generateOperationSteps('pop');
    if (newSteps.length > 0) {
      setSteps(newSteps);
      setCurrentStep(0);
      setIsPlaying(false);
    }
  };

  const handlePeek = () => {
    const newSteps = generateOperationSteps('peek');
    if (newSteps.length > 0) {
      setSteps(newSteps);
      setCurrentStep(0);
      setIsPlaying(false);
    }
  };

  const handleSearch = () => {
    const value = parseInt(searchValue);
    
    if (isNaN(value)) {
      setExplanation('Please enter a valid search value');
      return;
    }

    const newSteps = generateOperationSteps('search', value);
    if (newSteps.length > 0) {
      setSteps(newSteps);
      setCurrentStep(0);
      setIsPlaying(false);
      setSearchValue('');
    }
  };

  const handleTraverse = () => {
    const newSteps = generateOperationSteps('traverse');
    if (newSteps.length > 0) {
      setSteps(newSteps);
      setCurrentStep(0);
      setIsPlaying(false);
    }
  };

  // Reset visualization
  const resetVisualization = useCallback(() => {
    clearInterval(animationInterval.current);
    setIsPlaying(false);
    setCurrentStep(0);
    setSteps([]);
    setExplanation('Stack ready for operations. Use controls to perform stack operations.');
    setActiveLine(-1);
    setHighlightedIndex(-1);
    setFoundIndex(-1);
    setOperationType('');
  }, []);

  // Initialize on mount and when stackSize changes
  useEffect(() => {
    initializeStack();
  }, [initializeStack]);

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
      setHighlightedIndex(step.highlightedIndex);
      setStack(step.stack);
      if (step.foundIndex !== undefined) {
        setFoundIndex(step.foundIndex);
      }
    }
  }, [currentStep, steps]);

  // Clean up interval
  useEffect(() => {
    return () => clearInterval(animationInterval.current);
  }, []);

  // Render stack visualization
  const renderStack = () => {
    const topIndex = getTopIndex(stack);
    
    return (
      <div className="flex flex-col items-center space-y-6">
        {/* Stack visualization */}
        <div className="flex flex-col-reverse items-center space-y-reverse space-y-2 max-h-96 overflow-y-auto p-4">
          {stack.map((value, index) => {
            let bgColor = 'bg-gray-700';
            let borderColor = 'border-gray-600';
            let textColor = 'text-white';
            let isTop = index === topIndex;
            
            if (index === highlightedIndex) {
              if (operationType === 'search' && index === foundIndex) {
                bgColor = 'bg-green-600';
                borderColor = 'border-green-500';
              } else if (operationType === 'pop' && steps[currentStep]?.type === 'pop_mark') {
                bgColor = 'bg-red-600';
                borderColor = 'border-red-500';
              } else {
                bgColor = 'bg-blue-600';
                borderColor = 'border-blue-500';
              }
            } else if (value !== null) {
              bgColor = 'bg-gray-600';
            } else {
              bgColor = 'bg-gray-800';
              textColor = 'text-gray-500';
            }
            
            return (
              <div key={index} className="flex items-center space-x-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-32 h-12 flex items-center justify-center border-2 ${borderColor} ${bgColor} rounded-lg transition-all duration-300 font-bold ${textColor} shadow-lg relative`}
                  >
                    {value !== null ? value : 'Empty'}
                    {isTop && value !== null && (
                      <div className="absolute -top-6 text-yellow-400 text-sm font-bold">
                        TOP
                      </div>
                    )}
                  </div>
                  <div className="text-gray-400 text-sm mt-1 font-mono">
                    Index: {index}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Stack info */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className={`p-3 rounded-lg ${isStackEmpty ? 'bg-red-600' : 'bg-gray-700'}`}>
            <div className="text-white font-semibold">Empty</div>
            <div className="text-gray-300 text-sm">{isStackEmpty ? 'Yes' : 'No'}</div>
          </div>
          <div className={`p-3 rounded-lg ${isStackFull ? 'bg-red-600' : 'bg-gray-700'}`}>
            <div className="text-white font-semibold">Full</div>
            <div className="text-gray-300 text-sm">{isStackFull ? 'Yes' : 'No'}</div>
          </div>
        </div>
        
        {/* Step counter */}
        <div className="text-gray-300 text-lg">
          Step {currentStep + 1} of {steps.length}
        </div>
      </div>
    );
  };

  // Code snippets for different operations
  const pushCode = [
    "// Push operation",
    "function push(value) {",
    "    if (isFull()) {",
    "        throw 'Stack Overflow'",
    "    }",
    "    top++",
    "    stack[top] = value  // Add element",
    "}"
  ];

  const popCode = [
    "// Pop operation",
    "function pop() {",
    "    if (isEmpty()) {",
    "        throw 'Stack Underflow'",
    "    }",
    "    value = stack[top]  // Get top element",
    "    stack[top] = null   // Remove element",
    "    top--",
    "    return value",
    "}"
  ];

  const peekCode = [
    "// Peek operation",
    "function peek() {",
    "    if (isEmpty()) {",
    "        throw 'Stack is empty'",
    "    }",
    "    return stack[top]  // Return top element",
    "}"
  ];

  const searchCode = [
    "// Search operation",
    "function search(value) {",
    "    for (i = top; i >= 0; i--) {",
    "        if (stack[i] == value) {",
    "            return top - i + 1  // Position from top",
    "        }",
    "    }",
    "    return -1  // Not found",
    "}"
  ];

  const getCurrentCode = () => {
    switch (operationType) {
      case 'push': return pushCode;
      case 'pop': return popCode;
      case 'peek': return peekCode;
      case 'search': return searchCode;
      case 'traverse':
        return ["// Traverse", "for (i = top; i >= 0; i--) {", "    process(stack[i])", "}"];
      default: return ["// Select an operation to see code"];
    }
  };

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
          <h1 className="text-4xl font-bold text-white mb-2">Stack Data Structure Visualizer</h1>
          <p className="text-lg text-gray-300">
            "A Stack is a LIFO (Last-In-First-Out) linear data structure. Elements are added and removed from the same end called 'top'."
            <span className="ml-2 text-cyan-400">Push/Pop: O(1), Search: O(n)</span>
          </p>
        </div>

        {/* Controls Section */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Stack Initialization */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Stack Configuration</h3>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={stackSize}
                  onChange={(e) => setStackSize(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 input input-bordered bg-gray-700/50 border-gray-600 text-white"
                  min="1"
                  max="20"
                />
                <button 
                  onClick={initializeStack}
                  className="btn bg-blue-600 hover:bg-blue-700 border-none text-white"
                >
                  Initialize
                </button>
              </div>
              
              <div className="bg-gray-900/50 p-4 rounded-lg">
                <div className="text-green-400 font-bold text-lg">
                  Top Element: {topValue !== null ? topValue : 'None'}
                </div>
                <div className="text-yellow-400 text-sm mt-2">
                  Stack Size: {stack.filter(item => item !== null).length} / {stackSize}
                </div>
              </div>
            </div>

            {/* Basic Operations */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Basic Operations</h3>
              
              {/* Push */}
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={pushValue}
                  onChange={(e) => setPushValue(e.target.value)}
                  placeholder="Value to push"
                  className="flex-1 input input-bordered bg-gray-700/50 border-gray-600 text-white text-sm"
                />
                <button 
                  onClick={handlePush}
                  className="btn bg-green-600 hover:bg-green-700 border-none text-white"
                  disabled={isStackFull}
                >
                  <ArrowUp size={16} className="mr-1" />
                  Push
                </button>
              </div>

              {/* Pop & Peek */}
              <div className="flex space-x-2">
                <button 
                  onClick={handlePop}
                  className="flex-1 btn bg-red-600 hover:bg-red-700 border-none text-white"
                  disabled={isStackEmpty}
                >
                  <ArrowDown size={16} className="mr-1" />
                  Pop
                </button>
                <button 
                  onClick={handlePeek}
                  className="flex-1 btn bg-yellow-600 hover:bg-yellow-700 border-none text-white"
                  disabled={isStackEmpty}
                >
                  <Eye size={16} className="mr-1" />
                  Peek
                </button>
              </div>
            </div>

            {/* More Operations */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">More Operations</h3>
              
              {/* Search */}
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search value"
                  className="flex-1 input input-bordered bg-gray-700/50 border-gray-600 text-white text-sm"
                />
                <button 
                  onClick={handleSearch}
                  className="btn bg-purple-600 hover:bg-purple-700 border-none text-white"
                >
                  <Search size={16} className="mr-1" />
                  Search
                </button>
              </div>

              {/* Traverse */}
              <button 
                onClick={handleTraverse}
                className="w-full btn bg-cyan-600 hover:bg-cyan-700 border-none text-white"
                disabled={isStackEmpty}
              >
                <Eye size={16} className="mr-1" />
                Traverse
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Playback Controls */}
            <div className="flex space-x-2">
              <button 
                onClick={togglePlay}
                className="btn bg-green-600 hover:bg-green-700 border-none text-white"
                disabled={steps.length === 0}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button 
                onClick={stepBackward}
                className="btn bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
                disabled={currentStep === 0 || steps.length === 0}
              >
                <StepBack size={20} />
                Step Back
              </button>
              <button 
                onClick={stepForward}
                className="btn bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
                disabled={currentStep === steps.length - 1 || steps.length === 0}
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
          <h2 className="text-xl font-semibold text-white mb-4">Stack Visualization (LIFO - Last In First Out)</h2>
          <div className="min-h-96 bg-gray-900/50 rounded-lg border border-gray-700 p-6 flex items-center justify-center">
            {renderStack()}
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
            <h2 className="text-xl font-semibold text-white mb-4">Stack Operations Code</h2>
            <div className="h-64 overflow-y-auto font-mono text-sm bg-gray-900/70 p-4 rounded-lg">
              {getCurrentCode().map((line, index) => (
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Push</h3>
              <p className="text-gray-300">O(1)</p>
              <p className="text-sm text-gray-500 mt-2">Constant time - add to top</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Pop</h3>
              <p className="text-gray-300">O(1)</p>
              <p className="text-sm text-gray-500 mt-2">Constant time - remove from top</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Peek</h3>
              <p className="text-gray-300">O(1)</p>
              <p className="text-sm text-gray-500 mt-2">Constant time - access top element</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Search</h3>
              <p className="text-gray-300">O(n)</p>
              <p className="text-sm text-gray-500 mt-2">Linear time - may need to traverse</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Visualization Legend</h2>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded bg-blue-600 mr-2 border-2 border-blue-500"></div>
              <span className="text-gray-300">Currently accessing</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded bg-green-600 mr-2 border-2 border-green-500"></div>
              <span className="text-gray-300">Found element (search)</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded bg-red-600 mr-2 border-2 border-red-500"></div>
              <span className="text-gray-300">Element to pop</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded bg-gray-600 mr-2 border-2 border-gray-500"></div>
              <span className="text-gray-300">Stack element</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded bg-gray-800 mr-2 border-2 border-gray-700"></div>
              <span className="text-gray-300">Empty slot</span>
            </div>
          </div>
        </div>

        {/* Real-world Applications */}
        <div className="mt-6 bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Stack Applications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
            <div>
              <h3 className="text-cyan-400 mb-2">Programming:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Function call management (call stack)</li>
                <li>Expression evaluation</li>
                <li>Syntax parsing</li>
                <li>Backtracking algorithms</li>
              </ul>
            </div>
            <div>
              <h3 className="text-cyan-400 mb-2">Real World:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Undo/Redo functionality</li>
                <li>Browser history</li>
                <li>Plate stacking</li>
                <li>Memory management</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StackVisualizer;