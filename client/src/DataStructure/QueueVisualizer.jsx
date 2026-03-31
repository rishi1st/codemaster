import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, StepForward, StepBack, RefreshCw, Plus, Minus, Eye, Search, ArrowRight, ArrowLeft } from 'lucide-react';

const QueueVisualizer = () => {
  // State management
  const [queue, setQueue] = useState([]);
  const [queueSize, setQueueSize] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [speed, setSpeed] = useState(50);
  const [explanation, setExplanation] = useState('');
  const [activeLine, setActiveLine] = useState(-1);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [operationType, setOperationType] = useState('');
  const [enqueueValue, setEnqueueValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [frontValue, setFrontValue] = useState(null);
  const [rearValue, setRearValue] = useState(null);
  const [isQueueEmpty, setIsQueueEmpty] = useState(true);
  const [isQueueFull, setIsQueueFull] = useState(false);
  const [foundIndex, setFoundIndex] = useState(-1);
  const [frontIndex, setFrontIndex] = useState(-1);
  const [rearIndex, setRearIndex] = useState(-1);

  // Refs
  const animationInterval = useRef(null);

  // Initialize queue
  const initializeQueue = useCallback(() => {
    const initialQueue = Array(queueSize).fill(null);
    setQueue(initialQueue);
    setFrontValue(null);
    setRearValue(null);
    setFrontIndex(-1);
    setRearIndex(-1);
    setIsQueueEmpty(true);
    setIsQueueFull(false);
    setExplanation(`Queue initialized with capacity ${queueSize}`);
    resetVisualization();
  }, [queueSize]);

  // Update queue status
  useEffect(() => {
    const filledSlots = queue.filter(item => item !== null).length;
    setIsQueueEmpty(filledSlots === 0);
    setIsQueueFull(filledSlots === queueSize);
    
    // Find front and rear values
    let front = null;
    let rear = null;
    let frontIdx = -1;
    let rearIdx = -1;

    for (let i = 0; i < queue.length; i++) {
      if (queue[i] !== null) {
        if (front === null) {
          front = queue[i];
          frontIdx = i;
        }
        rear = queue[i];
        rearIdx = i;
      }
    }

    setFrontValue(front);
    setRearValue(rear);
    setFrontIndex(frontIdx);
    setRearIndex(rearIdx);
  }, [queue, queueSize]);

  // Generate steps for operations
  const generateOperationSteps = (operation, value) => {
    const newSteps = [];
    let currentQueue = [...queue];
    let currentFront = frontIndex;
    let currentRear = rearIndex;

    switch (operation) {
      case 'enqueue':
        if (isQueueFull) {
          setExplanation('Queue Overflow! Cannot enqueue to full queue.');
          return [];
        }

        // Step 1: Find next available position
        let enqueueIndex;
        if (currentRear === -1) { // Empty queue
          enqueueIndex = 0;
          newSteps.push({
            type: 'enqueue_prepare_empty',
            queue: [...currentQueue],
            explanation: `Queue is empty. Preparing to enqueue ${value} at the beginning.`,
            highlightedIndex: -1,
            line: 0,
            frontIndex: -1,
            rearIndex: -1
          });
        } else {
          enqueueIndex = currentRear + 1;
          newSteps.push({
            type: 'enqueue_prepare',
            queue: [...currentQueue],
            explanation: `Preparing to enqueue ${value} at the rear (index ${enqueueIndex})`,
            highlightedIndex: currentRear,
            line: 0,
            frontIndex: currentFront,
            rearIndex: currentRear
          });
        }

        // Step 2: Enqueue the value
        currentQueue[enqueueIndex] = value;
        const newRear = enqueueIndex;
        const newFront = currentFront === -1 ? enqueueIndex : currentFront;

        newSteps.push({
          type: 'enqueue',
          queue: [...currentQueue],
          explanation: `Enqueued ${value} at the rear. Front: ${newFront}, Rear: ${newRear}`,
          highlightedIndex: newRear,
          line: 1,
          frontIndex: newFront,
          rearIndex: newRear
        });

        setOperationType('enqueue');
        break;

      case 'dequeue':
        if (isQueueEmpty) {
          setExplanation('Queue Underflow! Cannot dequeue from empty queue.');
          return [];
        }

        const dequeueValue = currentQueue[currentFront];

        // Step 1: Highlight element to dequeue
        newSteps.push({
          type: 'dequeue_mark',
          queue: [...currentQueue],
          explanation: `Preparing to dequeue from front. Front element is ${dequeueValue} at index ${currentFront}`,
          highlightedIndex: currentFront,
          line: 2,
          frontIndex: currentFront,
          rearIndex: currentRear
        });

        // Step 2: Remove the element
        currentQueue[currentFront] = null;
        
        // Step 3: Find new front
        let newFrontIndex = -1;
        for (let i = currentFront + 1; i <= currentRear; i++) {
          if (currentQueue[i] !== null) {
            newFrontIndex = i;
            break;
          }
        }
        if (newFrontIndex === -1 && currentRear > currentFront) {
          newFrontIndex = currentRear;
        }

        newSteps.push({
          type: 'dequeue',
          queue: [...currentQueue],
          explanation: `Dequeued ${dequeueValue} from the front. ${newFrontIndex !== -1 ? `New front is at index ${newFrontIndex}` : 'Queue is now empty'}`,
          highlightedIndex: -1,
          line: 3,
          frontIndex: newFrontIndex,
          rearIndex: currentRear
        });

        setOperationType('dequeue');
        break;

      case 'front':
        if (isQueueEmpty) {
          setExplanation('Queue is empty! Cannot get front element.');
          return [];
        }

        newSteps.push({
          type: 'front',
          queue: [...currentQueue],
          explanation: `Front operation. Front element is ${currentQueue[currentFront]} at index ${currentFront}`,
          highlightedIndex: currentFront,
          line: 4,
          frontIndex: currentFront,
          rearIndex: currentRear
        });

        setOperationType('front');
        break;

      case 'rear':
        if (isQueueEmpty) {
          setExplanation('Queue is empty! Cannot get rear element.');
          return [];
        }

        newSteps.push({
          type: 'rear',
          queue: [...currentQueue],
          explanation: `Rear operation. Rear element is ${currentQueue[currentRear]} at index ${currentRear}`,
          highlightedIndex: currentRear,
          line: 5,
          frontIndex: currentFront,
          rearIndex: currentRear
        });

        setOperationType('rear');
        break;

      case 'search':
        let found = -1;
        for (let i = currentFront; i <= currentRear; i++) {
          if (currentQueue[i] === null) continue;
          
          newSteps.push({
            type: 'search_compare',
            queue: [...currentQueue],
            explanation: `Searching for ${value}... Checking index ${i}: ${currentQueue[i]}`,
            highlightedIndex: i,
            line: 6,
            frontIndex: currentFront,
            rearIndex: currentRear,
            foundIndex: -1
          });

          if (currentQueue[i] === value) {
            found = i;
            newSteps.push({
              type: 'search_found',
              queue: [...currentQueue],
              explanation: `Found ${value} at position ${i - currentFront + 1} from front (index ${i})!`,
              highlightedIndex: i,
              line: 7,
              frontIndex: currentFront,
              rearIndex: currentRear,
              foundIndex: i
            });
            break;
          }
        }

        if (found === -1) {
          newSteps.push({
            type: 'search_not_found',
            queue: [...currentQueue],
            explanation: `${value} not found in the queue`,
            highlightedIndex: -1,
            line: 8,
            frontIndex: currentFront,
            rearIndex: currentRear,
            foundIndex: -1
          });
        }

        setOperationType('search');
        break;

      case 'traverse':
        if (isQueueEmpty) {
          setExplanation('Queue is empty! Nothing to traverse.');
          return [];
        }

        for (let i = currentFront; i <= currentRear; i++) {
          if (currentQueue[i] === null) continue;
          
          newSteps.push({
            type: 'traverse',
            queue: [...currentQueue],
            explanation: `Traversing: Position ${i - currentFront + 1} - Value: ${currentQueue[i]} (Index: ${i})`,
            highlightedIndex: i,
            line: 9,
            frontIndex: currentFront,
            rearIndex: currentRear,
            foundIndex: -1
          });
        }

        newSteps.push({
          type: 'traverse_complete',
          queue: [...currentQueue],
          explanation: `Traversal complete. Queue has ${currentRear - currentFront + 1} elements.`,
          highlightedIndex: -1,
          line: 10,
          frontIndex: currentFront,
          rearIndex: currentRear,
          foundIndex: -1
        });

        setOperationType('traverse');
        break;

      default:
        return [];
    }

    return newSteps;
  };

  // Operation handlers
  const handleEnqueue = () => {
    const value = parseInt(enqueueValue);
    
    if (isNaN(value)) {
      setExplanation('Please enter a valid number to enqueue');
      return;
    }

    const newSteps = generateOperationSteps('enqueue', value);
    if (newSteps.length > 0) {
      setSteps(newSteps);
      setCurrentStep(0);
      setIsPlaying(false);
      setEnqueueValue('');
    }
  };

  const handleDequeue = () => {
    const newSteps = generateOperationSteps('dequeue');
    if (newSteps.length > 0) {
      setSteps(newSteps);
      setCurrentStep(0);
      setIsPlaying(false);
    }
  };

  const handleFront = () => {
    const newSteps = generateOperationSteps('front');
    if (newSteps.length > 0) {
      setSteps(newSteps);
      setCurrentStep(0);
      setIsPlaying(false);
    }
  };

  const handleRear = () => {
    const newSteps = generateOperationSteps('rear');
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
    setExplanation('Queue ready for operations. Use controls to perform queue operations.');
    setActiveLine(-1);
    setHighlightedIndex(-1);
    setFoundIndex(-1);
    setOperationType('');
  }, []);

  // Initialize on mount and when queueSize changes
  useEffect(() => {
    initializeQueue();
  }, [initializeQueue]);

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
      setQueue(step.queue);
      setFrontIndex(step.frontIndex);
      setRearIndex(step.rearIndex);
      if (step.foundIndex !== undefined) {
        setFoundIndex(step.foundIndex);
      }
    }
  }, [currentStep, steps]);

  // Clean up interval
  useEffect(() => {
    return () => clearInterval(animationInterval.current);
  }, []);

  // Render queue visualization
  const renderQueue = () => {
    return (
      <div className="flex flex-col items-center space-y-6">
        {/* Queue visualization */}
        <div className="flex flex-col items-center space-y-4">
          {/* Front and Rear pointers */}
          <div className="flex justify-between w-full max-w-2xl px-4">
            <div className="text-center">
              <div className="text-yellow-400 font-bold text-lg">FRONT</div>
              <div className="text-gray-400 text-sm">Index: {frontIndex}</div>
              <div className="text-gray-300">{frontValue !== null ? frontValue : 'None'}</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 font-bold text-lg">REAR</div>
              <div className="text-gray-400 text-sm">Index: {rearIndex}</div>
              <div className="text-gray-300">{rearValue !== null ? rearValue : 'None'}</div>
            </div>
          </div>

          {/* Queue elements */}
          <div className="flex flex-wrap justify-center gap-3">
            {queue.map((value, index) => {
              let bgColor = 'bg-gray-700';
              let borderColor = 'border-gray-600';
              let textColor = 'text-white';
              let isFront = index === frontIndex;
              let isRear = index === rearIndex;
              
              if (index === highlightedIndex) {
                if (operationType === 'search' && index === foundIndex) {
                  bgColor = 'bg-green-600';
                  borderColor = 'border-green-500';
                } else if (operationType === 'dequeue' && steps[currentStep]?.type === 'dequeue_mark') {
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
                <div key={index} className="flex flex-col items-center">
                  <div className="flex flex-col items-center">
                    {isFront && (
                      <div className="text-yellow-400 text-sm font-bold mb-1">
                        <ArrowRight size={16} className="inline mr-1" />
                        Front
                      </div>
                    )}
                    <div
                      className={`w-16 h-16 flex items-center justify-center border-2 ${borderColor} ${bgColor} rounded-lg transition-all duration-300 font-bold ${textColor} shadow-lg relative`}
                    >
                      {value !== null ? value : 'Empty'}
                    </div>
                    {isRear && (
                      <div className="text-yellow-400 text-sm font-bold mt-1">
                        <ArrowLeft size={16} className="inline mr-1" />
                        Rear
                      </div>
                    )}
                  </div>
                  <div className="text-gray-400 text-sm mt-1 font-mono">
                    [{index}]
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Queue info */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className={`p-3 rounded-lg ${isQueueEmpty ? 'bg-red-600' : 'bg-gray-700'}`}>
            <div className="text-white font-semibold">Empty</div>
            <div className="text-gray-300 text-sm">{isQueueEmpty ? 'Yes' : 'No'}</div>
          </div>
          <div className={`p-3 rounded-lg ${isQueueFull ? 'bg-red-600' : 'bg-gray-700'}`}>
            <div className="text-white font-semibold">Full</div>
            <div className="text-gray-300 text-sm">{isQueueFull ? 'Yes' : 'No'}</div>
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
  const enqueueCode = [
    "// Enqueue operation",
    "function enqueue(value) {",
    "    if (isFull()) {",
    "        throw 'Queue Overflow'",
    "    }",
    "    if (isEmpty()) {",
    "        front = 0",
    "    }",
    "    rear++",
    "    queue[rear] = value  // Add element at rear",
    "}"
  ];

  const dequeueCode = [
    "// Dequeue operation",
    "function dequeue() {",
    "    if (isEmpty()) {",
    "        throw 'Queue Underflow'",
    "    }",
    "    value = queue[front]  // Get front element",
    "    queue[front] = null   // Remove element",
    "    if (front == rear) {  // Queue becomes empty",
    "        front = -1",
    "        rear = -1",
    "    } else {",
    "        front++           // Move front forward",
    "    }",
    "    return value",
    "}"
  ];

  const frontCode = [
    "// Front operation",
    "function front() {",
    "    if (isEmpty()) {",
    "        throw 'Queue is empty'",
    "    }",
    "    return queue[front]  // Return front element",
    "}"
  ];

  const rearCode = [
    "// Rear operation",
    "function rear() {",
    "    if (isEmpty()) {",
    "        throw 'Queue is empty'",
    "    }",
    "    return queue[rear]  // Return rear element",
    "}"
  ];

  const searchCode = [
    "// Search operation",
    "function search(value) {",
    "    for (i = front; i <= rear; i++) {",
    "        if (queue[i] == value) {",
    "            return i - front + 1  // Position from front",
    "        }",
    "    }",
    "    return -1  // Not found",
    "}"
  ];

  const getCurrentCode = () => {
    switch (operationType) {
      case 'enqueue': return enqueueCode;
      case 'dequeue': return dequeueCode;
      case 'front': return frontCode;
      case 'rear': return rearCode;
      case 'search': return searchCode;
      case 'traverse':
        return ["// Traverse", "for (i = front; i <= rear; i++) {", "    process(queue[i])", "}"];
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
          <h1 className="text-4xl font-bold text-white mb-2">Queue Data Structure Visualizer</h1>
          <p className="text-lg text-gray-300">
            "A Queue is a FIFO (First-In-First-Out) linear data structure. Elements are added at the rear and removed from the front."
            <span className="ml-2 text-cyan-400">Enqueue/Dequeue: O(1), Search: O(n)</span>
          </p>
        </div>

        {/* Controls Section */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Queue Initialization */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Queue Configuration</h3>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={queueSize}
                  onChange={(e) => setQueueSize(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 input input-bordered bg-gray-700/50 border-gray-600 text-white"
                  min="1"
                  max="20"
                />
                <button 
                  onClick={initializeQueue}
                  className="btn bg-blue-600 hover:bg-blue-700 border-none text-white"
                >
                  Initialize
                </button>
              </div>
              
              <div className="bg-gray-900/50 p-4 rounded-lg">
                <div className="text-green-400 font-bold text-lg">
                  Size: {queue.filter(item => item !== null).length} / {queueSize}
                </div>
                <div className="text-yellow-400 text-sm mt-2">
                  Front: {frontValue !== null ? frontValue : 'None'} 
                  {frontIndex !== -1 && ` [Index: ${frontIndex}]`}
                </div>
                <div className="text-yellow-400 text-sm">
                  Rear: {rearValue !== null ? rearValue : 'None'}
                  {rearIndex !== -1 && ` [Index: ${rearIndex}]`}
                </div>
              </div>
            </div>

            {/* Basic Operations */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Basic Operations</h3>
              
              {/* Enqueue */}
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={enqueueValue}
                  onChange={(e) => setEnqueueValue(e.target.value)}
                  placeholder="Value to enqueue"
                  className="flex-1 input input-bordered bg-gray-700/50 border-gray-600 text-white text-sm"
                />
                <button 
                  onClick={handleEnqueue}
                  className="btn bg-green-600 hover:bg-green-700 border-none text-white"
                  disabled={isQueueFull}
                >
                  <Plus size={16} className="mr-1" />
                  Enqueue
                </button>
              </div>

              {/* Dequeue */}
              <div className="flex space-x-2">
                <button 
                  onClick={handleDequeue}
                  className="flex-1 btn bg-red-600 hover:bg-red-700 border-none text-white"
                  disabled={isQueueEmpty}
                >
                  <Minus size={16} className="mr-1" />
                  Dequeue
                </button>
              </div>
            </div>

            {/* More Operations */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">More Operations</h3>
              
              {/* Front & Rear */}
              <div className="flex space-x-2">
                <button 
                  onClick={handleFront}
                  className="flex-1 btn bg-yellow-600 hover:bg-yellow-700 border-none text-white"
                  disabled={isQueueEmpty}
                >
                  <Eye size={16} className="mr-1" />
                  Front
                </button>
                <button 
                  onClick={handleRear}
                  className="flex-1 btn bg-purple-600 hover:bg-purple-700 border-none text-white"
                  disabled={isQueueEmpty}
                >
                  <Eye size={16} className="mr-1" />
                  Rear
                </button>
              </div>

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
                  className="btn bg-cyan-600 hover:bg-cyan-700 border-none text-white"
                >
                  <Search size={16} className="mr-1" />
                  Search
                </button>
              </div>

              {/* Traverse */}
              <button 
                onClick={handleTraverse}
                className="w-full btn bg-orange-600 hover:bg-orange-700 border-none text-white"
                disabled={isQueueEmpty}
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
          <h2 className="text-xl font-semibold text-white mb-4">Queue Visualization (FIFO - First In First Out)</h2>
          <div className="min-h-96 bg-gray-900/50 rounded-lg border border-gray-700 p-6 flex items-center justify-center">
            {renderQueue()}
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
            <h2 className="text-xl font-semibold text-white mb-4">Queue Operations Code</h2>
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
              <h3 className="text-lg text-cyan-400 mb-2">Enqueue</h3>
              <p className="text-gray-300">O(1)</p>
              <p className="text-sm text-gray-500 mt-2">Constant time - add to rear</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Dequeue</h3>
              <p className="text-gray-300">O(1)</p>
              <p className="text-sm text-gray-500 mt-2">Constant time - remove from front</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Front/Rear</h3>
              <p className="text-gray-300">O(1)</p>
              <p className="text-sm text-gray-500 mt-2">Constant time - access ends</p>
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
              <span className="text-gray-300">Element to dequeue</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded bg-gray-600 mr-2 border-2 border-gray-500"></div>
              <span className="text-gray-300">Queue element</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded bg-gray-800 mr-2 border-2 border-gray-700"></div>
              <span className="text-gray-300">Empty slot</span>
            </div>
          </div>
        </div>

        {/* Real-world Applications */}
        <div className="mt-6 bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Queue Applications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
            <div>
              <h3 className="text-cyan-400 mb-2">Computer Systems:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>CPU scheduling</li>
                <li>Disk scheduling</li>
                <li>Print spooling</li>
                <li>Buffering</li>
              </ul>
            </div>
            <div>
              <h3 className="text-cyan-400 mb-2">Real World:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Customer service lines</li>
                <li>Ticket counters</li>
                <li>Traffic systems</li>
                <li>Message queues</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Queue Types */}
        <div className="mt-6 bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Queue Variations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-300">
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Circular Queue</h3>
              <p className="text-sm">Efficient space utilization, rear connects to front</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Priority Queue</h3>
              <p className="text-sm">Elements with priority, higher priority served first</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Double Ended Queue</h3>
              <p className="text-sm">Insert/delete from both ends (Deque)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueVisualizer;