import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, StepForward, StepBack, RefreshCw } from 'lucide-react';

const LCSVisualizer = () => {
  // State management
  const [string1, setString1] = useState('ABCDGH');
  const [string2, setString2] = useState('AEDFHR');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [speed, setSpeed] = useState(50);
  const [explanation, setExplanation] = useState('');
  const [activeLine, setActiveLine] = useState(-1);
  const [lcsLength, setLcsLength] = useState(0);
  const [lcsString, setLcsString] = useState('');
  const [highlightedCells, setHighlightedCells] = useState(new Set());
  const [currentCell, setCurrentCell] = useState({ i: -1, j: -1 });

  // Refs
  const animationInterval = useRef(null);
  const dpTable = useRef([]);

  // LCS DP implementation
  const generateLCSSteps = useCallback((str1, str2) => {
    const steps = [];
    const m = str1.length;
    const n = str2.length;
    
    // Initialize DP table
    const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    dpTable.current = dp;

    // Initial state
    steps.push({
      type: 'init',
      dp: JSON.parse(JSON.stringify(dp)),
      explanation: 'Initializing DP table with zeros...',
      line: 0,
      currentCell: { i: -1, j: -1 }
    });

    // Fill DP table
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        // Start computing cell (i, j)
        steps.push({
          type: 'compute_start',
          i, j,
          dp: JSON.parse(JSON.stringify(dp)),
          explanation: `Computing LCS for prefixes: "${str1.substring(0, i)}" and "${str2.substring(0, j)}"`,
          line: 1,
          currentCell: { i, j }
        });

        if (str1[i - 1] === str2[j - 1]) {
          // Characters match
          dp[i][j] = dp[i - 1][j - 1] + 1;
          steps.push({
            type: 'match',
            i, j,
            dp: JSON.parse(JSON.stringify(dp)),
            explanation: `Characters match: '${str1[i-1]}' == '${str2[j-1]}'\nLCS[${i}][${j}] = LCS[${i-1}][${j-1}] + 1 = ${dp[i][j]}`,
            line: 2,
            currentCell: { i, j }
          });
        } else {
          // Characters don't match
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          steps.push({
            type: 'mismatch',
            i, j,
            dp: JSON.parse(JSON.stringify(dp)),
            explanation: `Characters don't match: '${str1[i-1]}' != '${str2[j-1]}'\nLCS[${i}][${j}] = max(LCS[${i-1}][${j}], LCS[${i}][${j-1}]) = ${dp[i][j]}`,
            line: 3,
            currentCell: { i, j }
          });
        }

        // Cell computed
        steps.push({
          type: 'compute_end',
          i, j,
          dp: JSON.parse(JSON.stringify(dp)),
          explanation: `Completed cell [${i}][${j}] = ${dp[i][j]}`,
          line: -1,
          currentCell: { i, j }
        });
      }
    }

    // Backtrack to find LCS string
    steps.push({
      type: 'backtrack_start',
      dp: JSON.parse(JSON.stringify(dp)),
      explanation: 'Starting backtracking to find actual LCS string...',
      line: 4,
      currentCell: { i: m, j: n }
    });

    let i = m, j = n;
    const lcsChars = [];
    const backtrackSteps = [];
    const highlighted = new Set();

    while (i > 0 && j > 0) {
      highlighted.add(`${i},${j}`);
      
      if (str1[i - 1] === str2[j - 1]) {
        backtrackSteps.push({
          type: 'backtrack_match',
          i, j,
          dp: JSON.parse(JSON.stringify(dp)),
          explanation: `Characters match: '${str1[i-1]}' == '${str2[j-1]}'\nAdd '${str1[i-1]}' to LCS, move diagonally`,
          line: 5,
          currentCell: { i, j },
          highlightedCells: new Set(highlighted),
          lcsSoFar: [...lcsChars].reverse().join('')
        });
        lcsChars.push(str1[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        backtrackSteps.push({
          type: 'backtrack_up',
          i, j,
          dp: JSON.parse(JSON.stringify(dp)),
          explanation: `Move up (LCS[${i-1}][${j}] = ${dp[i-1][j]} > LCS[${i}][${j-1}] = ${dp[i][j-1]})`,
          line: 6,
          currentCell: { i, j },
          highlightedCells: new Set(highlighted),
          lcsSoFar: [...lcsChars].reverse().join('')
        });
        i--;
      } else {
        backtrackSteps.push({
          type: 'backtrack_left',
          i, j,
          dp: JSON.parse(JSON.stringify(dp)),
          explanation: `Move left (LCS[${i}][${j-1}] = ${dp[i][j-1]} >= LCS[${i-1}][${j}] = ${dp[i-1][j]})`,
          line: 7,
          currentCell: { i, j },
          highlightedCells: new Set(highlighted),
          lcsSoFar: [...lcsChars].reverse().join('')
        });
        j--;
      }
    }

    // Add backtrack steps in reverse order to show progression
    steps.push(...backtrackSteps);

    // Final result
    const finalLCS = lcsChars.reverse().join('');
    steps.push({
      type: 'complete',
      dp: JSON.parse(JSON.stringify(dp)),
      explanation: `LCS Complete!\nLength: ${dp[m][n]}\nString: "${finalLCS}"`,
      line: 8,
      currentCell: { i: -1, j: -1 },
      highlightedCells: new Set(highlighted),
      lcsSoFar: finalLCS
    });

    return steps;
  }, []);

  // Reset visualization
  const resetVisualization = useCallback(() => {
    clearInterval(animationInterval.current);
    setIsPlaying(false);
    setCurrentStep(0);
    const newSteps = generateLCSSteps(string1, string2);
    setSteps(newSteps);
    setExplanation('Ready to compute Longest Common Subsequence...');
    setActiveLine(-1);
    setLcsLength(0);
    setLcsString('');
    setHighlightedCells(new Set());
    setCurrentCell({ i: -1, j: -1 });
  }, [string1, string2, generateLCSSteps]);

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
      setCurrentCell(step.currentCell || { i: -1, j: -1 });
      
      if (step.highlightedCells) {
        setHighlightedCells(step.highlightedCells);
      }
      
      if (step.dp) {
        dpTable.current = step.dp;
        const m = dpTable.current.length - 1;
        const n = dpTable.current[0]?.length - 1 || 0;
        if (m > 0 && n > 0) {
          setLcsLength(dpTable.current[m][n]);
        }
      }
      
      if (step.lcsSoFar !== undefined) {
        setLcsString(step.lcsSoFar);
      }
      
      if (step.type === 'complete') {
        setLcsString(step.lcsSoFar);
      }
    }
  }, [currentStep, steps]);

  // Clean up interval
  useEffect(() => {
    return () => clearInterval(animationInterval.current);
  }, []);

  // Render DP table
  const renderDPTable = () => {
    if (!dpTable.current || dpTable.current.length === 0) return null;

    const m = dpTable.current.length - 1;
    const n = dpTable.current[0]?.length - 1 || 0;

    return (
      <div className="space-y-4">
        <div className="text-white font-semibold mb-4">DP Table:</div>
        <div className="overflow-auto">
          <table className="border-collapse border border-gray-600 mx-auto">
            <tbody>
              {/* Header row with string2 */}
              <tr>
                <td className="w-12 h-12 border border-gray-600 bg-gray-800 text-center"></td>
                <td className="w-12 h-12 border border-gray-600 bg-gray-800 text-center text-gray-400">0</td>
                {string2.split('').map((char, j) => (
                  <td key={j} className="w-12 h-12 border border-gray-600 bg-gray-800 text-center text-yellow-300 font-bold">
                    {char}
                  </td>
                ))}
              </tr>
              
              {/* First row (i=0) */}
              <tr>
                <td className="w-12 h-12 border border-gray-600 bg-gray-800 text-center text-gray-400">0</td>
                {dpTable.current[0]?.map((val, j) => {
                  const isCurrent = currentCell.i === 0 && currentCell.j === j;
                  const isHighlighted = highlightedCells.has(`0,${j}`);
                  return (
                    <td
                      key={j}
                      className={`w-12 h-12 border border-gray-600 text-center font-mono font-bold transition-all duration-300 ${
                        isCurrent ? 'bg-blue-600 text-white' :
                        isHighlighted ? 'bg-green-600 text-white' :
                        'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {val}
                    </td>
                  );
                })}
              </tr>
              
              {/* Data rows */}
              {dpTable.current.slice(1).map((row, i) => (
                <tr key={i}>
                  <td className="w-12 h-12 border border-gray-600 bg-gray-800 text-center text-yellow-300 font-bold">
                    {string1[i]}
                  </td>
                  {row.map((val, j) => {
                    const isCurrent = currentCell.i === i + 1 && currentCell.j === j;
                    const isHighlighted = highlightedCells.has(`${i + 1},${j}`);
                    return (
                      <td
                        key={j}
                        className={`w-12 h-12 border border-gray-600 text-center font-mono font-bold transition-all duration-300 ${
                          isCurrent ? 'bg-blue-600 text-white' :
                          isHighlighted ? 'bg-green-600 text-white' :
                          'bg-gray-700 text-gray-300'
                        }`}
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
  const lcsCode = [
    "function lcs(X, Y, m, n) {",
    "  let dp = new Array(m+1);",
    "  for (let i = 0; i <= m; i++) {",
    "    dp[i] = new Array(n+1);",
    "    for (let j = 0; j <= n; j++) {",
    "      if (i == 0 || j == 0)",
    "        dp[i][j] = 0;",
    "      else if (X[i-1] == Y[j-1])",
    "        dp[i][j] = dp[i-1][j-1] + 1;",
    "      else",
    "        dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);",
    "    }",
    "  }",
    "  return dp[m][n];",
    "}"
  ];

  const backtrackCode = [
    "// Backtrack to find LCS string",
    "function findLCS(X, Y, dp, m, n) {",
    "  let i = m, j = n;",
    "  let lcs = [];",
    "  while (i > 0 && j > 0) {",
    "    if (X[i-1] == Y[j-1]) {",
    "      lcs.push(X[i-1]);",
    "      i--; j--;  // Move diagonally",
    "    } else if (dp[i-1][j] > dp[i][j-1]) {",
    "      i--;       // Move up",
    "    } else {",
    "      j--;       // Move left",
    "    }",
    "  }",
    "  return lcs.reverse().join('');",
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
          <h1 className="text-4xl font-bold text-white mb-2">Longest Common Subsequence Visualizer</h1>
          <p className="text-lg text-gray-300">
            "The Longest Common Subsequence (LCS) problem finds the longest subsequence common to two sequences.
            Dynamic Programming solves this in O(mn) time using a 2D table."
            <span className="ml-2 text-cyan-400">Complexity: O(mn), Space: O(mn)</span>
          </p>
        </div>

        {/* Controls Section */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Input String 1 */}
            <div className="flex flex-col space-y-2">
              <label className="text-gray-300 text-sm">String 1:</label>
              <input
                type="text"
                value={string1}
                onChange={(e) => setString1(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                className="input input-bordered bg-gray-700/50 border-gray-600 text-white"
                placeholder="Enter string 1"
              />
            </div>

            {/* Input String 2 */}
            <div className="flex flex-col space-y-2">
              <label className="text-gray-300 text-sm">String 2:</label>
              <input
                type="text"
                value={string2}
                onChange={(e) => setString2(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                className="input input-bordered bg-gray-700/50 border-gray-600 text-white"
                placeholder="Enter string 2"
              />
            </div>

            {/* LCS Info */}
            <div className="flex flex-col space-y-2 justify-center">
              <div className="text-gray-300 text-sm">
                LCS Length: <span className="text-green-400 font-bold">{lcsLength}</span>
              </div>
              <div className="text-gray-300 text-sm">
                LCS String: <span className="text-yellow-400 font-bold">"{lcsString}"</span>
              </div>
            </div>

            {/* Step Counter */}
            <div className="flex flex-col space-y-2 justify-center">
              <div className="text-gray-300 text-sm">
                Step: {currentStep + 1} of {steps.length}
              </div>
              <div className="text-gray-300 text-sm">
                Table Size: {string1.length} × {string2.length}
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
            <h2 className="text-xl font-semibold text-white mb-4">LCS Algorithm</h2>
            <div className="font-mono text-sm bg-gray-900/70 p-4 rounded-lg overflow-x-auto">
              <div className="mb-4">
                <div className="text-cyan-400 mb-2">// DP Table Construction</div>
                {lcsCode.map((line, index) => (
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
                    className={`py-1 px-2 ${activeLine === index + lcsCode.length ? 'bg-teal-900/50 text-cyan-300' : 'text-gray-300'}`}
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
              <p className="text-gray-300">O(m × n)</p>
              <p className="text-sm text-gray-500 mt-2">Where m and n are lengths of input strings</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Space Complexity</h3>
              <p className="text-gray-300">O(m × n)</p>
              <p className="text-sm text-gray-500 mt-2">For the DP table storage</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Optimized Space</h3>
              <p className="text-gray-300">O(min(m, n))</p>
              <p className="text-sm text-gray-500 mt-2">Using only two rows</p>
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
              <span className="text-gray-300">Backtracking path (LCS)</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded bg-gray-700 mr-2 border border-gray-600"></div>
              <span className="text-gray-300">Computed cells</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded bg-gray-800 mr-2 border border-gray-600"></div>
              <span className="text-gray-300">String characters</span>
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
                <li>Initialize table with zeros for base cases</li>
                <li>For each cell (i, j):
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>If characters match: dp[i][j] = dp[i-1][j-1] + 1</li>
                    <li>Else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])</li>
                  </ul>
                </li>
                <li>Bottom-right cell contains LCS length</li>
              </ol>
            </div>
            <div>
              <h3 className="text-cyan-400 mb-2">Backtracking:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Start from bottom-right cell</li>
                <li>If characters match, add to LCS and move diagonally</li>
                <li>Else, move to cell with higher value (up or left)</li>
                <li>Continue until reaching top or left boundary</li>
                <li>Reverse the collected characters for final LCS</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LCSVisualizer;