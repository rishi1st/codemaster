import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, StepForward, StepBack, RefreshCw, Plus, Trash2, Search, Edit3, Eye } from 'lucide-react';

const ArrayVisualizer = () => {
  // State management
  const [array, setArray] = useState([]);
  const [arraySize, setArraySize] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [speed, setSpeed] = useState(50);
  const [explanation, setExplanation] = useState('');
  const [activeLine, setActiveLine] = useState(-1);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [operationType, setOperationType] = useState('');
  const [customValues, setCustomValues] = useState('');
  const [insertIndex, setInsertIndex] = useState('');
  const [insertValue, setInsertValue] = useState('');
  const [deleteIndex, setDeleteIndex] = useState('');
  const [updateIndex, setUpdateIndex] = useState('');
  const [updateValue, setUpdateValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [foundIndex, setFoundIndex] = useState(-1);

  // Refs
  const animationInterval = useRef(null);

  // Initialize array
  const initializeArray = useCallback(() => {
    const newArray = Array.from({ length: arraySize }, () => 
      Math.floor(Math.random() * 100) + 1
    );
    setArray(newArray);
    setExplanation(`Array initialized with ${arraySize} random values`);
    resetVisualization();
  }, [arraySize]);

  // Initialize with custom values
  const initializeCustomArray = () => {
    if (!customValues.trim()) {
      setExplanation('Please enter comma-separated values');
      return;
    }
    
    try {
      const values = customValues.split(',').map(val => {
        const num = parseInt(val.trim());
        if (isNaN(num)) throw new Error('Invalid number');
        return num;
      });
      
      if (values.length > arraySize) {
        setExplanation(`Too many values! Maximum ${arraySize} allowed.`);
        return;
      }
      
      // Pad with zeros if needed
      const paddedValues = [...values, ...Array(arraySize - values.length).fill(0)];
      setArray(paddedValues);
      setExplanation(`Array initialized with custom values`);
      resetVisualization();
    } catch (error) {
      setExplanation('Please enter valid numbers separated by commas');
    }
  };

  // Generate steps for operations
  const generateOperationSteps = (operation, index, value) => {
    const newSteps = [];
    let currentArray = [...array];
    
    switch (operation) {
      case 'insert':
        if (index < 0 || index > array.length) {
          setExplanation('Invalid index for insertion');
          return [];
        }
        if (array.length >= arraySize) {
          setExplanation('Array is full! Cannot insert new element');
          return [];
        }
        
        // Step 1: Show shifting preparation
        newSteps.push({
          type: 'shift_prepare',
          array: [...currentArray],
          explanation: `Preparing to insert ${value} at index ${index}. Need to shift elements to the right.`,
          highlightedIndex: -1,
          line: 0
        });
        
        // Steps for shifting
        for (let i = array.length - 1; i >= index; i--) {
          currentArray[i + 1] = currentArray[i];
          newSteps.push({
            type: 'shift_right',
            array: [...currentArray],
            explanation: `Shifting element at index ${i} → index ${i + 1}`,
            highlightedIndex: i,
            line: 1
          });
        }
        
        // Step for insertion
        currentArray[index] = value;
        newSteps.push({
          type: 'insert',
          array: [...currentArray],
          explanation: `Inserted ${value} at index ${index}`,
          highlightedIndex: index,
          line: 2
        });
        
        setOperationType('insert');
        break;
        
      case 'delete':
        if (index < 0 || index >= array.length) {
          setExplanation('Invalid index for deletion');
          return [];
        }
        
        // Step 1: Show element to be deleted
        newSteps.push({
          type: 'delete_mark',
          array: [...currentArray],
          explanation: `Preparing to delete element at index ${index} (value: ${currentArray[index]})`,
          highlightedIndex: index,
          line: 3
        });
        
        // Steps for shifting left
        for (let i = index; i < array.length - 1; i++) {
          currentArray[i] = currentArray[i + 1];
          newSteps.push({
            type: 'shift_left',
            array: [...currentArray],
            explanation: `Shifting element at index ${i + 1} → index ${i}`,
            highlightedIndex: i,
            line: 4
          });
        }
        
        // Clear last element
        currentArray[array.length - 1] = 0;
        newSteps.push({
          type: 'delete_complete',
          array: [...currentArray],
          explanation: `Deletion complete. Array size reduced.`,
          highlightedIndex: -1,
          line: 5
        });
        
        setOperationType('delete');
        break;
        
      case 'update':
        if (index < 0 || index >= array.length) {
          setExplanation('Invalid index for update');
          return [];
        }
        
        newSteps.push({
          type: 'update',
          array: array.map((val, i) => i === index ? value : val),
          explanation: `Updated index ${index} from ${array[index]} to ${value}`,
          highlightedIndex: index,
          line: 6
        });
        
        setOperationType('update');
        break;
        
      case 'search':
        let found = -1;
        for (let i = 0; i < array.length; i++) {
          newSteps.push({
            type: 'search_compare',
            array: [...array],
            explanation: `Comparing index ${i} (${array[i]}) with ${value}...`,
            highlightedIndex: i,
            line: 7,
            foundIndex: -1
          });
          
          if (array[i] === value) {
            found = i;
            newSteps.push({
              type: 'search_found',
              array: [...array],
              explanation: `Found ${value} at index ${i}!`,
              highlightedIndex: i,
              line: 8,
              foundIndex: i
            });
            break;
          }
        }
        
        if (found === -1) {
          newSteps.push({
            type: 'search_not_found',
            array: [...array],
            explanation: `${value} not found in the array`,
            highlightedIndex: -1,
            line: 9,
            foundIndex: -1
          });
        }
        
        setOperationType('search');
        break;
        
      case 'traverse':
        for (let i = 0; i < array.length; i++) {
          newSteps.push({
            type: 'traverse',
            array: [...array],
            explanation: `Visiting index ${i}: value = ${array[i]}`,
            highlightedIndex: i,
            line: 10,
            foundIndex: -1
          });
        }
        newSteps.push({
          type: 'traverse_complete',
          array: [...array],
          explanation: `Traversal complete. Visited all ${array.length} elements.`,
          highlightedIndex: -1,
          line: 11,
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
  const handleInsert = () => {
    const index = parseInt(insertIndex);
    const value = parseInt(insertValue);
    
    if (isNaN(index) || isNaN(value)) {
      setExplanation('Please enter valid index and value');
      return;
    }
    
    const newSteps = generateOperationSteps('insert', index, value);
    if (newSteps.length > 0) {
      setSteps(newSteps);
      setCurrentStep(0);
      setIsPlaying(false);
      setInsertIndex('');
      setInsertValue('');
    }
  };

  const handleDelete = () => {
    const index = parseInt(deleteIndex);
    
    if (isNaN(index)) {
      setExplanation('Please enter valid index');
      return;
    }
    
    const newSteps = generateOperationSteps('delete', index);
    if (newSteps.length > 0) {
      setSteps(newSteps);
      setCurrentStep(0);
      setIsPlaying(false);
      setDeleteIndex('');
    }
  };

  const handleUpdate = () => {
    const index = parseInt(updateIndex);
    const value = parseInt(updateValue);
    
    if (isNaN(index) || isNaN(value)) {
      setExplanation('Please enter valid index and value');
      return;
    }
    
    const newSteps = generateOperationSteps('update', index, value);
    if (newSteps.length > 0) {
      setSteps(newSteps);
      setCurrentStep(0);
      setIsPlaying(false);
      setUpdateIndex('');
      setUpdateValue('');
    }
  };

  const handleSearch = () => {
    const value = parseInt(searchValue);
    
    if (isNaN(value)) {
      setExplanation('Please enter valid search value');
      return;
    }
    
    const newSteps = generateOperationSteps('search', -1, value);
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
    setExplanation('Array ready for operations. Use controls to perform operations.');
    setActiveLine(-1);
    setHighlightedIndex(-1);
    setFoundIndex(-1);
    setOperationType('');
  }, []);

  // Initialize on mount and when arraySize changes
  useEffect(() => {
    initializeArray();
  }, [initializeArray]);

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
      setArray(step.array);
      if (step.foundIndex !== undefined) {
        setFoundIndex(step.foundIndex);
      }
    }
  }, [currentStep, steps]);

  // Clean up interval
  useEffect(() => {
    return () => clearInterval(animationInterval.current);
  }, []);

  // Render array visualization
  const renderArray = () => {
    return (
      <div className="flex flex-col items-center space-y-6">
        {/* Array blocks */}
        <div className="flex flex-wrap justify-center gap-4">
          {array.map((value, index) => {
            let bgColor = 'bg-gray-700';
            let borderColor = 'border-gray-600';
            let textColor = 'text-white';
            
            if (index === highlightedIndex) {
              if (operationType === 'search' && index === foundIndex) {
                bgColor = 'bg-green-600';
                borderColor = 'border-green-500';
              } else if (operationType === 'delete' && steps[currentStep]?.type === 'delete_mark') {
                bgColor = 'bg-red-600';
                borderColor = 'border-red-500';
              } else {
                bgColor = 'bg-blue-600';
                borderColor = 'border-blue-500';
              }
            }
            
            return (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`w-16 h-16 flex items-center justify-center border-2 ${borderColor} ${bgColor} rounded-lg transition-all duration-300 font-bold ${textColor} shadow-lg`}
                >
                  {value}
                </div>
                <div className="text-gray-400 text-sm mt-2 font-mono">
                  [{index}]
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Step counter */}
        <div className="text-gray-300 text-lg">
          Step {currentStep + 1} of {steps.length}
        </div>
      </div>
    );
  };

  // Code snippets for different operations
  const insertCode = [
    "// Insert at index",
    "for (i = size-1; i >= pos; i--) {",
    "    arr[i+1] = arr[i]     // Shift right",
    "}",
    "arr[pos] = value",
    "size++"
  ];

  const deleteCode = [
    "// Delete at index",
    "for (i = pos; i < size-1; i++) {",
    "    arr[i] = arr[i+1]     // Shift left",
    "}",
    "size--"
  ];

  const searchCode = [
    "// Linear search",
    "for (i = 0; i < size; i++) {",
    "    if (arr[i] == x) {",
    "        return i          // Found",
    "    }",
    "}",
    "return -1                // Not found"
  ];

  const getCurrentCode = () => {
    switch (operationType) {
      case 'insert': return insertCode;
      case 'delete': return deleteCode;
      case 'search': return searchCode;
      case 'update': 
        return ["// Update at index", "arr[index] = newValue"];
      case 'traverse':
        return ["// Traverse", "for (i = 0; i < size; i++) {", "    visit(arr[i])", "}"];
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
          <h1 className="text-4xl font-bold text-white mb-2">Array Data Structure Visualizer</h1>
          <p className="text-lg text-gray-300">
            "An array is a fixed-size linear data structure that stores elements of the same type in contiguous memory locations."
            <span className="ml-2 text-cyan-400">Access: O(1), Insertion/Deletion: O(n)</span>
          </p>
        </div>

        {/* Controls Section */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Array Initialization */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Array Initialization</h3>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={arraySize}
                  onChange={(e) => setArraySize(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 input input-bordered bg-gray-700/50 border-gray-600 text-white"
                  min="1"
                  max="20"
                />
                <button 
                  onClick={initializeArray}
                  className="btn bg-blue-600 hover:bg-blue-700 border-none text-white"
                >
                  Random
                </button>
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={customValues}
                  onChange={(e) => setCustomValues(e.target.value)}
                  placeholder="Custom values (comma separated)"
                  className="flex-1 input input-bordered bg-gray-700/50 border-gray-600 text-white text-sm"
                />
                <button 
                  onClick={initializeCustomArray}
                  className="btn bg-green-600 hover:bg-green-700 border-none text-white"
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Operations */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Operations</h3>
              
              {/* Insert */}
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={insertIndex}
                  onChange={(e) => setInsertIndex(e.target.value)}
                  placeholder="Index"
                  className="w-20 input input-bordered bg-gray-700/50 border-gray-600 text-white text-sm"
                />
                <input
                  type="number"
                  value={insertValue}
                  onChange={(e) => setInsertValue(e.target.value)}
                  placeholder="Value"
                  className="w-20 input input-bordered bg-gray-700/50 border-gray-600 text-white text-sm"
                />
                <button 
                  onClick={handleInsert}
                  className="flex-1 btn bg-green-600 hover:bg-green-700 border-none text-white"
                >
                  <Plus size={16} className="mr-1" />
                  Insert
                </button>
              </div>

              {/* Delete */}
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={deleteIndex}
                  onChange={(e) => setDeleteIndex(e.target.value)}
                  placeholder="Index"
                  className="flex-1 input input-bordered bg-gray-700/50 border-gray-600 text-white text-sm"
                />
                <button 
                  onClick={handleDelete}
                  className="btn bg-red-600 hover:bg-red-700 border-none text-white"
                >
                  <Trash2 size={16} className="mr-1" />
                  Delete
                </button>
              </div>
            </div>

            {/* More Operations */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">More Operations</h3>
              
              {/* Update */}
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={updateIndex}
                  onChange={(e) => setUpdateIndex(e.target.value)}
                  placeholder="Index"
                  className="w-20 input input-bordered bg-gray-700/50 border-gray-600 text-white text-sm"
                />
                <input
                  type="number"
                  value={updateValue}
                  onChange={(e) => setUpdateValue(e.target.value)}
                  placeholder="Value"
                  className="w-20 input input-bordered bg-gray-700/50 border-gray-600 text-white text-sm"
                />
                <button 
                  onClick={handleUpdate}
                  className="flex-1 btn bg-yellow-600 hover:bg-yellow-700 border-none text-white"
                >
                  <Edit3 size={16} className="mr-1" />
                  Update
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
          <h2 className="text-xl font-semibold text-white mb-4">Array Visualization</h2>
          <div className="min-h-64 bg-gray-900/50 rounded-lg border border-gray-700 p-6 flex items-center justify-center">
            {renderArray()}
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
            <h2 className="text-xl font-semibold text-white mb-4">Algorithm Code</h2>
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
              <h3 className="text-lg text-cyan-400 mb-2">Access</h3>
              <p className="text-gray-300">O(1)</p>
              <p className="text-sm text-gray-500 mt-2">Direct access by index</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Search</h3>
              <p className="text-gray-300">O(n)</p>
              <p className="text-sm text-gray-500 mt-2">Linear search required</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Insertion</h3>
              <p className="text-gray-300">O(n)</p>
              <p className="text-sm text-gray-500 mt-2">Shifting elements required</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Deletion</h3>
              <p className="text-gray-300">O(n)</p>
              <p className="text-sm text-gray-500 mt-2">Shifting elements required</p>
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
              <span className="text-gray-300">Element to delete</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded bg-gray-700 mr-2 border-2 border-gray-600"></div>
              <span className="text-gray-300">Regular element</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArrayVisualizer;