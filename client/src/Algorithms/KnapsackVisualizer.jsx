import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, StepForward, StepBack, RefreshCw, Plus, Trash2 } from 'lucide-react';

const KnapsackVisualizer = () => {
  // State management
  const [items, setItems] = useState([
    { id: 1, weight: 2, value: 3, name: 'Item 1' },
    { id: 2, weight: 3, value: 4, name: 'Item 2' },
    { id: 3, weight: 4, value: 5, name: 'Item 3' },
    { id: 4, weight: 5, value: 8, name: 'Item 4' }
  ]);
  const [capacity, setCapacity] = useState(8);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [speed, setSpeed] = useState(50);
  const [explanation, setExplanation] = useState('');
  const [activeLine, setActiveLine] = useState(-1);
  const [maxValue, setMaxValue] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const [highlightedCells, setHighlightedCells] = useState(new Set());
  const [currentCell, setCurrentCell] = useState({ i: -1, w: -1 });
  const [newItem, setNewItem] = useState({ weight: '', value: '', name: '' });

  // Refs
  const animationInterval = useRef(null);
  const dpTable = useRef([]);

  // Knapsack DP implementation
  const generateKnapsackSteps = useCallback((items, cap) => {
    const steps = [];
    const n = items.length;
    const W = cap;
    
    // Initialize DP table
    const dp = Array(n + 1).fill().map(() => Array(W + 1).fill(0));
    dpTable.current = dp;

    // Initial state
    steps.push({
      type: 'init',
      dp: JSON.parse(JSON.stringify(dp)),
      explanation: `Initializing DP table with ${n} items and capacity ${W}...`,
      line: 0,
      currentCell: { i: -1, w: -1 }
    });

    // Fill DP table
    for (let i = 1; i <= n; i++) {
      const currentItem = items[i - 1];
      
      for (let w = 0; w <= W; w++) {
        // Start computing cell (i, w)
        steps.push({
          type: 'compute_start',
          i, w,
          dp: JSON.parse(JSON.stringify(dp)),
          explanation: `Considering item ${i} (${currentItem.name}) at capacity ${w}...`,
          line: 1,
          currentCell: { i, w }
        });

        if (currentItem.weight <= w) {
          // Item can be included
          const includeValue = currentItem.value + dp[i - 1][w - currentItem.weight];
          const excludeValue = dp[i - 1][w];
          
          steps.push({
            type: 'consider_include',
            i, w,
            dp: JSON.parse(JSON.stringify(dp)),
            explanation: `Item ${i} (weight ${currentItem.weight}) can be included.\nInclude: ${currentItem.value} + dp[${i-1}][${w - currentItem.weight}] = ${includeValue}\nExclude: dp[${i-1}][${w}] = ${excludeValue}`,
            line: 2,
            currentCell: { i, w }
          });

          if (includeValue > excludeValue) {
            dp[i][w] = includeValue;
            steps.push({
              type: 'include',
              i, w,
              dp: JSON.parse(JSON.stringify(dp)),
              explanation: `Include item ${i} - better value (${includeValue} > ${excludeValue})`,
              line: 3,
              currentCell: { i, w }
            });
          } else {
            dp[i][w] = excludeValue;
            steps.push({
              type: 'exclude',
              i, w,
              dp: JSON.parse(JSON.stringify(dp)),
              explanation: `Exclude item ${i} - better to skip (${excludeValue} >= ${includeValue})`,
              line: 4,
              currentCell: { i, w }
            });
          }
        } else {
          // Item cannot be included (too heavy)
          dp[i][w] = dp[i - 1][w];
          steps.push({
            type: 'too_heavy',
            i, w,
            dp: JSON.parse(JSON.stringify(dp)),
            explanation: `Item ${i} (weight ${currentItem.weight}) is too heavy for capacity ${w}. Skip.`,
            line: 5,
            currentCell: { i, w }
          });
        }

        // Cell computed
        steps.push({
          type: 'compute_end',
          i, w,
          dp: JSON.parse(JSON.stringify(dp)),
          explanation: `dp[${i}][${w}] = ${dp[i][w]}`,
          line: -1,
          currentCell: { i, w }
        });
      }
    }

    // Backtrack to find selected items
    steps.push({
      type: 'backtrack_start',
      dp: JSON.parse(JSON.stringify(dp)),
      explanation: `Starting backtracking... Maximum value: ${dp[n][W]}`,
      line: 6,
      currentCell: { i: n, w: W }
    });

    let i = n, w = W;
    const selected = [];
    const backtrackSteps = [];
    const highlighted = new Set();

    while (i > 0 && w > 0) {
      highlighted.add(`${i},${w}`);
      
      if (dp[i][w] !== dp[i - 1][w]) {
        // Item i was included
        const item = items[i - 1];
        selected.push(item);
        backtrackSteps.push({
          type: 'backtrack_include',
          i, w,
          dp: JSON.parse(JSON.stringify(dp)),
          explanation: `Item ${i} (${item.name}) was included. Remaining capacity: ${w - item.weight}`,
          line: 7,
          currentCell: { i, w },
          highlightedCells: new Set(highlighted),
          selectedItems: [...selected]
        });
        w -= item.weight;
        i--;
      } else {
        // Item i was excluded
        backtrackSteps.push({
          type: 'backtrack_exclude',
          i, w,
          dp: JSON.parse(JSON.stringify(dp)),
          explanation: `Item ${i} (${items[i-1].name}) was excluded.`,
          line: 8,
          currentCell: { i, w },
          highlightedCells: new Set(highlighted),
          selectedItems: [...selected]
        });
        i--;
      }
    }

    // Add backtrack steps
    steps.push(...backtrackSteps);

    // Final result
    steps.push({
      type: 'complete',
      dp: JSON.parse(JSON.stringify(dp)),
      explanation: `Knapsack Complete!\nMaximum Value: ${dp[n][W]}\nSelected Items: ${selected.map(item => item.name).join(', ')}\nTotal Weight: ${selected.reduce((sum, item) => sum + item.weight, 0)}`,
      line: 9,
      currentCell: { i: -1, w: -1 },
      highlightedCells: new Set(highlighted),
      selectedItems: selected
    });

    return steps;
  }, []);

  // Reset visualization
  const resetVisualization = useCallback(() => {
    clearInterval(animationInterval.current);
    setIsPlaying(false);
    setCurrentStep(0);
    const newSteps = generateKnapsackSteps(items, capacity);
    setSteps(newSteps);
    setExplanation('Ready to solve Knapsack problem...');
    setActiveLine(-1);
    setMaxValue(0);
    setSelectedItems([]);
    setHighlightedCells(new Set());
    setCurrentCell({ i: -1, w: -1 });
  }, [items, capacity, generateKnapsackSteps]);

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
      setCurrentCell(step.currentCell || { i: -1, w: -1 });
      
      if (step.highlightedCells) {
        setHighlightedCells(step.highlightedCells);
      }
      
      if (step.dp) {
        dpTable.current = step.dp;
        const n = dpTable.current.length - 1;
        const W = dpTable.current[0]?.length - 1 || 0;
        if (n > 0 && W > 0) {
          setMaxValue(dpTable.current[n][W]);
        }
      }
      
      if (step.selectedItems !== undefined) {
        setSelectedItems(step.selectedItems);
      }
      
      if (step.type === 'complete') {
        setSelectedItems(step.selectedItems);
      }
    }
  }, [currentStep, steps]);

  // Clean up interval
  useEffect(() => {
    return () => clearInterval(animationInterval.current);
  }, []);

  // Add new item
  const addItem = () => {
    if (!newItem.weight || !newItem.value || !newItem.name) {
      setExplanation('Please fill all fields for the new item.');
      return;
    }

    const weight = parseInt(newItem.weight);
    const value = parseInt(newItem.value);

    if (weight <= 0 || value <= 0) {
      setExplanation('Weight and value must be positive numbers.');
      return;
    }

    const newItemObj = {
      id: items.length + 1,
      weight,
      value,
      name: newItem.name
    };

    setItems(prev => [...prev, newItemObj]);
    setNewItem({ weight: '', value: '', name: '' });
    setExplanation(`Added ${newItem.name} (weight: ${weight}, value: ${value})`);
  };

  // Remove item
  const removeItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Render DP table
  const renderDPTable = () => {
    if (!dpTable.current || dpTable.current.length === 0) return null;

    const n = dpTable.current.length - 1;
    const W = dpTable.current[0]?.length - 1 || 0;

    return (
      <div className="space-y-4">
        <div className="text-white font-semibold mb-4">DP Table (items × capacity):</div>
        <div className="overflow-auto max-h-96">
          <table className="border-collapse border border-gray-600 mx-auto">
            <tbody>
              {/* Header row with capacities */}
              <tr>
                <td className="w-12 h-12 border border-gray-600 bg-gray-800 text-center text-gray-400">i\w</td>
                {Array.from({ length: W + 1 }, (_, w) => (
                  <td key={w} className="w-12 h-12 border border-gray-600 bg-gray-800 text-center text-yellow-300 font-bold">
                    {w}
                  </td>
                ))}
              </tr>
              
              {/* Data rows */}
              {dpTable.current.map((row, i) => (
                <tr key={i}>
                  <td className="w-12 h-12 border border-gray-600 bg-gray-800 text-center text-yellow-300 font-bold">
                    {i === 0 ? '0' : ` ${i}`}
                  </td>
                  {row.map((val, w) => {
                    const isCurrent = currentCell.i === i && currentCell.w === w;
                    const isHighlighted = highlightedCells.has(`${i},${w}`);
                    let bgColor = 'bg-gray-700';
                    
                    if (isCurrent) bgColor = 'bg-blue-600';
                    else if (isHighlighted) bgColor = 'bg-green-600';
                    else if (i === 0 || w === 0) bgColor = 'bg-gray-800';

                    return (
                      <td
                        key={w}
                        className={`w-12 h-12 border border-gray-600 text-center font-mono font-bold transition-all duration-300 ${bgColor} text-gray-300`}
                      >
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Code snippets
  const knapsackCode = [
    "function knapsack(weights, values, W) {",
    "  let n = weights.length;",
    "  let dp = new Array(n+1);",
    "  for (let i = 0; i <= n; i++) {",
    "    dp[i] = new Array(W+1).fill(0);",
    "  }",
    "  ",
    "  for (let i = 1; i <= n; i++) {",
    "    for (let w = 0; w <= W; w++) {",
    "      if (weights[i-1] <= w) {",
    "        dp[i][w] = Math.max(",
    "          dp[i-1][w], // exclude",
    "          values[i-1] + dp[i-1][w - weights[i-1]] // include",
    "        );",
    "      } else {",
    "        dp[i][w] = dp[i-1][w]; // too heavy",
    "      }",
    "    }",
    "  }",
    "  return dp[n][W];",
    "}"
  ];

  const backtrackCode = [
    "// Backtrack to find selected items",
    "function findItems(weights, values, dp, W) {",
    "  let i = weights.length, w = W;",
    "  let selected = [];",
    "  while (i > 0 && w > 0) {",
    "    if (dp[i][w] !== dp[i-1][w]) {",
    "      selected.push(i-1); // item included",
    "      w -= weights[i-1];",
    "    }",
    "    i--;",
    "  }",
    "  return selected.reverse();",
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
          <h1 className="text-4xl font-bold text-white mb-2">0/1 Knapsack Problem Visualizer</h1>
          <p className="text-lg text-gray-300">
            "Given items with weights and values, determine the most valuable combination that fits in a knapsack of fixed capacity."
            <span className="ml-2 text-cyan-400">Complexity: O(nW), Pseudo-polynomial</span>
          </p>
        </div>

        {/* Controls Section */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Items Management */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Items</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-gray-700/50 p-2 rounded">
                    <div className="text-white text-sm">
                      {item.name}: {item.weight}kg, ${item.value}
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Add Item Form */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Item name"
                  className="w-full input input-bordered bg-gray-700/50 border-gray-600 text-white text-sm"
                />
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={newItem.weight}
                    onChange={(e) => setNewItem(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="Weight"
                    className="flex-1 input input-bordered bg-gray-700/50 border-gray-600 text-white text-sm"
                  />
                  <input
                    type="number"
                    value={newItem.value}
                    onChange={(e) => setNewItem(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="Value"
                    className="flex-1 input input-bordered bg-gray-700/50 border-gray-600 text-white text-sm"
                  />
                  <button 
                    onClick={addItem}
                    className="btn bg-green-600 hover:bg-green-700 border-none text-white"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Capacity and Results */}
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label className="text-gray-300 text-sm">Knapsack Capacity:</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="input input-bordered bg-gray-700/50 border-gray-600 text-white"
                  min="1"
                />
              </div>
              
              <div className="bg-gray-900/50 p-4 rounded-lg">
                <div className="text-green-400 font-bold text-lg">
                  Max Value: ${maxValue}
                </div>
                <div className="text-yellow-400 text-sm mt-2">
                  Selected Items: {selectedItems.map(item => item.name).join(', ') || 'None'}
                </div>
                <div className="text-cyan-400 text-sm">
                  Total Weight: {selectedItems.reduce((sum, item) => sum + item.weight, 0)} / {capacity}
                </div>
              </div>
            </div>

            {/* Step Info */}
            <div className="space-y-4">
              <div className="text-gray-300 text-sm">
                Step: {currentStep + 1} of {steps.length}
              </div>
              <div className="text-gray-300 text-sm">
                Table Size: {items.length + 1} × {capacity + 1}
              </div>
              <div className="text-gray-300 text-sm">
                Items: {items.length}
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
          <h2 className="text-xl font-semibold text-white mb-4">DP Table Visualization</h2>
          <div className="min-h-96 bg-gray-900/50 rounded-lg border border-gray-700 p-6 flex items-center justify-center">
            {renderDPTable()}
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
            <h2 className="text-xl font-semibold text-white mb-4">Knapsack Algorithm</h2>
            <div className="font-mono text-sm bg-gray-900/70 p-4 rounded-lg overflow-x-auto">
              <div className="mb-4">
                <div className="text-cyan-400 mb-2">// DP Table Construction</div>
                {knapsackCode.map((line, index) => (
                  <div
                    key={index}
                    className={`py-1 px-2 ${activeLine === index ? 'bg-teal-900/50 text-cyan-300' : 'text-gray-300'}`}
                  >
                    {line}
                  </div>
                ))}
              </div>
              <div>
                <div className="text-cyan-400 mb-2">// Backtracking</div>
                {backtrackCode.map((line, index) => (
                  <div
                    key={index}
                    className={`py-1 px-2 ${activeLine === index + knapsackCode.length ? 'bg-teal-900/50 text-cyan-300' : 'text-gray-300'}`}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Complexity Information */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Complexity Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Time Complexity</h3>
              <p className="text-gray-300">O(n × W)</p>
              <p className="text-sm text-gray-500 mt-2">Where n = items, W = capacity</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Space Complexity</h3>
              <p className="text-gray-300">O(n × W)</p>
              <p className="text-sm text-gray-500 mt-2">For the DP table storage</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Optimized Space</h3>
              <p className="text-gray-300">O(W)</p>
              <p className="text-sm text-gray-500 mt-2">Using single array</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Visualization Legend</h2>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded bg-blue-600 mr-2"></div>
              <span className="text-gray-300">Current cell being computed</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded bg-green-600 mr-2"></div>
              <span className="text-gray-300">Backtracking path</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded bg-gray-700 mr-2 border border-gray-600"></div>
              <span className="text-gray-300">Computed cells</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded bg-gray-800 mr-2 border border-gray-600"></div>
              <span className="text-gray-300">Base cases (0)</span>
            </div>
          </div>
        </div>

        {/* Algorithm Steps */}
        <div className="mt-6 bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Algorithm Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
            <div>
              <h3 className="text-cyan-400 mb-2">DP Table Construction:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Initialize table with zeros</li>
                <li>For each item i (1 to n):
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>For each capacity w (0 to W):
                      <ul className="list-circle list-inside ml-4 mt-1">
                        <li>If item fits (weight ≤ w):
                          <br/>dp[i][w] = max(exclude, include)
                        </li>
                        <li>Else: dp[i][w] = dp[i-1][w]</li>
                      </ul>
                    </li>
                  </ul>
                </li>
                <li>Bottom-right cell contains max value</li>
              </ol>
            </div>
            <div>
              <h3 className="text-cyan-400 mb-2">Backtracking:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Start from bottom-right cell</li>
                <li>If dp[i][w] ≠ dp[i-1][w]:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Item i was included</li>
                    <li>Add to selected items</li>
                    <li>Reduce capacity by item weight</li>
                  </ul>
                </li>
                <li>Move to previous item</li>
                <li>Continue until reaching top row</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnapsackVisualizer;