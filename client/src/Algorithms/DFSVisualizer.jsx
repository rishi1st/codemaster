import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, StepForward, StepBack, RefreshCw, Plus, Minus, ArrowRight } from 'lucide-react';

const DFSVisualizer = () => {
  // State management
  const [graph, setGraph] = useState({
    nodes: [],
    edges: [],
    adjacencyList: {}
  });
  const [startNode, setStartNode] = useState('');
  const [searching, setSearching] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [speed, setSpeed] = useState(50);
  const [highlightMode, setHighlightMode] = useState('current');
  const [visitedCount, setVisitedCount] = useState(0);
  const [currentNode, setCurrentNode] = useState(null);
  const [visitedNodes, setVisitedNodes] = useState(new Set());
  const [stackNodes, setStackNodes] = useState([]);
  const [newNodeId, setNewNodeId] = useState('');
  const [edgeFrom, setEdgeFrom] = useState('');
  const [edgeTo, setEdgeTo] = useState('');
  const [isDirected, setIsDirected] = useState(false);
  const [graphSize, setGraphSize] = useState(5);
  const [explanation, setExplanation] = useState('');
  const [codeSnippet] = useState([
    "DFS(start):",
    "  create stack S",
    "  mark start as visited",
    "  push start onto S",
    "  while S not empty:",
    "    node = pop(S)",
    "    for each neighbor of node:",
    "      if not visited:",
    "        mark visited",
    "        push neighbor"
  ]);
  const [activeLine, setActiveLine] = useState(-1);

  // Refs
  const searchInterval = useRef(null);
  const svgRef = useRef(null);

  // Initialize graph
  useEffect(() => {
    generateRandomGraph(graphSize);
  }, [graphSize]);

  // Generate random graph
  const generateRandomGraph = (size) => {
    const nodes = Array.from({ length: size }, (_, i) => ({
      id: String.fromCharCode(65 + i),
      x: Math.random() * 400 + 50,
      y: Math.random() * 300 + 50
    }));

    const edges = [];
    const adjacencyList = {};

    // Initialize adjacency list
    nodes.forEach(node => {
      adjacencyList[node.id] = [];
    });

    // Create random edges (approximately 1.5 edges per node)
    for (let i = 0; i < size * 1.5; i++) {
      const from = nodes[Math.floor(Math.random() * size)].id;
      const to = nodes[Math.floor(Math.random() * size)].id;
      
      if (from !== to && !adjacencyList[from].includes(to)) {
        edges.push({ from, to });
        adjacencyList[from].push(to);
        
        // If undirected, add reverse edge
        if (!isDirected) {
          if (!adjacencyList[to].includes(from)) {
            adjacencyList[to].push(from);
          }
        }
      }
    }

    setGraph({ nodes, edges, adjacencyList });
    resetSearch();
    setExplanation(`Random graph with ${size} nodes generated. Select a start node and begin DFS.`);
  };

  // Add a new node
  const addNode = () => {
    if (!newNodeId || graph.nodes.find(n => n.id === newNodeId)) {
      setExplanation('Please enter a unique node ID (A-Z).');
      return;
    }

    const newNode = {
      id: newNodeId.toUpperCase(),
      x: Math.random() * 400 + 50,
      y: Math.random() * 300 + 50
    };

    setGraph(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      adjacencyList: { ...prev.adjacencyList, [newNode.id]: [] }
    }));

    setNewNodeId('');
    setExplanation(`Node ${newNode.id} added to the graph.`);
  };

  // Add an edge
  const addEdge = () => {
    if (!edgeFrom || !edgeTo) {
      setExplanation('Please enter both source and target nodes.');
      return;
    }

    const from = edgeFrom.toUpperCase();
    const to = edgeTo.toUpperCase();

    if (!graph.adjacencyList[from] || !graph.adjacencyList[to]) {
      setExplanation('One or both nodes do not exist.');
      return;
    }

    if (from === to) {
      setExplanation('Self-loops are not supported.');
      return;
    }

    if (graph.edges.find(e => e.from === from && e.to === to)) {
      setExplanation('Edge already exists.');
      return;
    }

    const newEdge = { from, to };
    const newEdges = [...graph.edges, newEdge];
    const newAdjacencyList = { ...graph.adjacencyList };
    
    if (!newAdjacencyList[from].includes(to)) {
      newAdjacencyList[from].push(to);
    }

    if (!isDirected && !newAdjacencyList[to].includes(from)) {
      newAdjacencyList[to].push(from);
    }

    setGraph(prev => ({
      ...prev,
      edges: newEdges,
      adjacencyList: newAdjacencyList
    }));

    setEdgeFrom('');
    setEdgeTo('');
    setExplanation(`Edge ${from} → ${to} added.`);
  };

  // Remove a node and its edges
  const removeNode = (nodeId) => {
    const newNodes = graph.nodes.filter(n => n.id !== nodeId);
    const newEdges = graph.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
    const newAdjacencyList = { ...graph.adjacencyList };
    delete newAdjacencyList[nodeId];

    // Remove references to the deleted node
    Object.keys(newAdjacencyList).forEach(key => {
      newAdjacencyList[key] = newAdjacencyList[key].filter(n => n !== nodeId);
    });

    setGraph({
      nodes: newNodes,
      edges: newEdges,
      adjacencyList: newAdjacencyList
    });

    setExplanation(`Node ${nodeId} removed from the graph.`);
  };

  // Reset search
  const resetSearch = () => {
    clearInterval(searchInterval.current);
    setSearching(false);
    setCurrentStep(0);
    setSteps([]);
    setVisitedCount(0);
    setCurrentNode(null);
    setVisitedNodes(new Set());
    setStackNodes([]);
    setActiveLine(-1);
  };

  // Generate DFS steps
  const generateDFSSteps = () => {
    if (!startNode || !graph.adjacencyList[startNode]) {
      setExplanation('Please select a valid start node.');
      return [];
    }

    const newSteps = [];
    const visited = new Set();
    const stack = [startNode];
    visited.add(startNode);
    let stepCount = 0;

    // Initial state
    newSteps.push({
      stack: [...stack],
      visited: new Set(visited),
      currentNode: null,
      explanation: `Step ${++stepCount}: Start from node ${startNode}. Push ${startNode} onto stack. Stack = [${stack.join(', ')}]`,
      line: 1
    });

    while (stack.length > 0) {
      const current = stack.pop();
      
      // Pop step
      newSteps.push({
        stack: [...stack],
        visited: new Set(visited),
        currentNode: current,
        explanation: `Step ${++stepCount}: Pop ${current} from stack. Visit ${current}.`,
        line: 5
      });

      visited.add(current);

      // Process neighbors (in reverse order for DFS)
      const neighbors = graph.adjacencyList[current] || [];
      let neighborsAdded = false;

      // Push neighbors in reverse order to maintain proper DFS order
      for (let i = neighbors.length - 1; i >= 0; i--) {
        const neighbor = neighbors[i];
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          stack.push(neighbor);
          neighborsAdded = true;
          
          newSteps.push({
            stack: [...stack],
            visited: new Set(visited),
            currentNode: current,
            explanation: `Step ${++stepCount}: Discover neighbor ${neighbor} of ${current}. Push ${neighbor} onto stack. Stack = [${stack.join(', ')}]`,
            line: 7
          });
        }
      }

      if (!neighborsAdded && neighbors.length > 0) {
        newSteps.push({
          stack: [...stack],
          visited: new Set(visited),
          currentNode: current,
          explanation: `Step ${++stepCount}: All neighbors of ${current} already visited. Stack = [${stack.join(', ')}]`,
          line: 5
        });
      }

      // After processing current node
      newSteps.push({
        stack: [...stack],
        visited: new Set(visited),
        currentNode: null,
        explanation: `Step ${++stepCount}: Finished processing ${current}. Stack = [${stack.join(', ')}]`,
        line: 5
      });
    }

    // Final state
    newSteps.push({
      stack: [],
      visited: new Set(visited),
      currentNode: null,
      explanation: `DFS completed! Visited ${visited.size} nodes: [${Array.from(visited).join(', ')}]`,
      line: 9
    });

    setSteps(newSteps);
    return newSteps;
  };

  // Start DFS
  const startDFS = () => {
    if (searching) {
      clearInterval(searchInterval.current);
      setSearching(false);
      return;
    }

    if (steps.length === 0 || currentStep === steps.length - 1) {
      const newSteps = generateDFSSteps();
      if (newSteps.length === 0) return;
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
      const newSteps = generateDFSSteps();
      if (newSteps.length === 0) return;
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
      setCurrentNode(step.currentNode);
      setVisitedNodes(step.visited);
      setStackNodes(step.stack);
      setVisitedCount(step.visited.size);
      setExplanation(step.explanation);
      setActiveLine(step.line);
    }
  }, [currentStep, steps]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => clearInterval(searchInterval.current);
  }, []);

  // Get node color based on state
  const getNodeColor = (nodeId) => {
    if (nodeId === currentNode) return 'bg-blue-500'; // Current node
    if (visitedNodes.has(nodeId)) return 'bg-green-500'; // Visited nodes
    if (stackNodes.includes(nodeId)) return 'bg-orange-500'; // Nodes in stack
    return 'bg-gray-600'; // Unvisited nodes
  };

  return (
    <div className="pt-22 min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6 overflow-x-hidden relative">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-purple-500/10 animate-pulse"
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

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Depth First Search (DFS) Algorithm</h1>
          <p className="text-lg text-gray-300">
            DFS explores a graph by going as deep as possible along each branch before backtracking.
            <span className="ml-2 text-cyan-400">Time Complexity: O(V + E), Space Complexity: O(V)</span>
          </p>
        </div>

        {/* Controls Section */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Add Node */}
            <div className="flex flex-col space-y-2">
              <label className="text-gray-300 text-sm">Add Node (A-Z):</label>
              <div className="flex">
                <input
                  type="text"
                  value={newNodeId}
                  onChange={(e) => setNewNodeId(e.target.value)}
                  placeholder="Node ID"
                  className="flex-grow input input-bordered bg-gray-700/50 border-gray-600 text-white placeholder-gray-500"
                  maxLength={1}
                />
                <button 
                  onClick={addNode}
                  className="ml-2 btn bg-green-600 hover:bg-green-700 border-none text-white"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Add Edge */}
            <div className="flex flex-col space-y-2">
              <label className="text-gray-300 text-sm">Add Edge:</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={edgeFrom}
                  onChange={(e) => setEdgeFrom(e.target.value)}
                  placeholder="From"
                  className="flex-1 input input-bordered bg-gray-700/50 border-gray-600 text-white"
                  maxLength={1}
                />
                <ArrowRight className="text-gray-400 mt-2" size={16} />
                <input
                  type="text"
                  value={edgeTo}
                  onChange={(e) => setEdgeTo(e.target.value)}
                  placeholder="To"
                  className="flex-1 input input-bordered bg-gray-700/50 border-gray-600 text-white"
                  maxLength={1}
                />
                <button 
                  onClick={addEdge}
                  className="btn bg-blue-600 hover:bg-blue-700 border-none text-white"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="directed"
                  checked={isDirected}
                  onChange={(e) => setIsDirected(e.target.checked)}
                  className="checkbox checkbox-sm"
                />
                <label htmlFor="directed" className="text-gray-300 text-sm">Directed Graph</label>
              </div>
            </div>

            {/* Start Node */}
            <div className="flex flex-col space-y-2">
              <label className="text-gray-300 text-sm">Start Node for DFS:</label>
              <div className="flex">
                <select
                  value={startNode}
                  onChange={(e) => setStartNode(e.target.value)}
                  className="flex-grow select select-bordered bg-gray-700/50 border-gray-600 text-white"
                >
                  <option value="">Select start node</option>
                  {graph.nodes.map(node => (
                    <option key={node.id} value={node.id}>{node.id}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Generate Random Graph */}
            <div className="flex flex-col space-y-2">
              <label className="text-gray-300 text-sm">Generate Random Graph:</label>
              <div className="flex">
                <select
                  value={graphSize}
                  onChange={(e) => setGraphSize(parseInt(e.target.value))}
                  className="flex-grow select select-bordered bg-gray-700/50 border-gray-600 text-white"
                >
                  <option value={5}>5 nodes</option>
                  <option value={10}>10 nodes</option>
                  <option value={15}>15 nodes</option>
                  <option value={20}>20 nodes</option>
                </select>
                <button 
                  onClick={() => generateRandomGraph(graphSize)}
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
                onClick={startDFS}
                className="btn bg-green-600 hover:bg-green-700 border-none text-white"
                disabled={!startNode}
              >
                {searching ? <Pause size={20} /> : <Play size={20} />}
                {searching ? 'Pause' : 'Play'}
              </button>
              <button 
                onClick={stepBackward}
                className="btn bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
                disabled={!startNode}
              >
                <StepBack size={20} />
                Step Back
              </button>
              <button 
                onClick={stepForward}
                className="btn bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
                disabled={!startNode}
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
                    startDFS();
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
                <option value="current">Current Node</option>
                <option value="visited">Visited Nodes</option>
                <option value="stack">Stack Nodes</option>
                <option value="all">All States</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats and Step Counter */}
        <div className="flex flex-wrap justify-between items-center mb-6 bg-gray-800/50 rounded-xl p-4 backdrop-blur-md">
          <div className="text-sm text-gray-300">
            <span className="mr-4">Step: {currentStep + 1} of {steps.length}</span>
            <span>Visited: {visitedCount} / {graph.nodes.length} nodes</span>
          </div>
          
          <div className="flex items-center space-x-4 mt-2 md:mt-0">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
              <span className="text-xs text-gray-400">Current</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
              <span className="text-xs text-gray-400">In Stack</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
              <span className="text-xs text-gray-400">Visited</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gray-600 mr-1"></div>
              <span className="text-xs text-gray-400">Unvisited</span>
            </div>
          </div>
        </div>

        {/* Visualization Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Graph Visualization */}
          <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Graph Visualization</h2>
            <div className="relative h-96 bg-gray-900/50 rounded-lg border border-gray-700">
              <svg
                ref={svgRef}
                width="100%"
                height="100%"
                className="rounded-lg"
              >
                {/* Draw edges */}
                {graph.edges.map((edge, index) => {
                  const fromNode = graph.nodes.find(n => n.id === edge.from);
                  const toNode = graph.nodes.find(n => n.id === edge.to);
                  
                  if (!fromNode || !toNode) return null;

                  return (
                    <line
                      key={index}
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      stroke={isDirected ? "#4F46E5" : "#6B7280"}
                      strokeWidth="2"
                      markerEnd={isDirected ? "url(#arrowhead)" : undefined}
                    />
                  );
                })}

                {/* Draw nodes */}
                {graph.nodes.map((node) => (
                  <g key={node.id}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="20"
                      className={`${getNodeColor(node.id)} transition-all duration-300 cursor-pointer`}
                      onClick={() => setStartNode(node.id)}
                    />
                    <text
                      x={node.x}
                      y={node.y}
                      textAnchor="middle"
                      dy=".3em"
                      fill="white"
                      fontSize="14"
                      fontWeight="bold"
                      pointerEvents="none"
                    >
                      {node.id}
                    </text>

                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="20"
                      fill="transparent"
                      className="cursor-pointer"
                      onClick={() => removeNode(node.id)}
                    />
                  </g>
                ))}

                {/* Arrowhead marker for directed edges */}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#4F46E5"
                    />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>

          {/* Stack Visualization */}
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Stack Status</h2>
            <div className="h-80 bg-gray-900/50 rounded-lg border border-gray-700 p-4">
              <div className="text-gray-300 mb-2">Current Stack (top to bottom):</div>
              <div className="flex flex-col-reverse gap-2 min-h-12">
                {stackNodes.length === 0 ? (
                  <div className="text-gray-500 italic">Stack is empty</div>
                ) : (
                  stackNodes.map((node, index) => (
                    <div
                      key={index}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === stackNodes.length - 1 ? 'bg-red-500' : 'bg-orange-500'
                      } transition-all duration-300`}
                    >
                      {node}
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-6 text-gray-300 mb-2">Visited Nodes:</div>
              <div className="flex flex-wrap gap-2">
                {Array.from(visitedNodes).map((node, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-white text-xs"
                  >
                    {node}
                  </div>
                ))}
              </div>

              {currentNode && (
                <div className="mt-6 p-3 bg-blue-900/30 rounded-lg">
                  <div className="text-blue-300 font-semibold">Currently Processing:</div>
                  <div className="text-white text-xl font-bold mt-1">{currentNode}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Explanation and Code Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Explanation Panel */}
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Step Explanation</h2>
            <div className="h-64 overflow-y-auto">
              <p className="text-gray-300 whitespace-pre-line">{explanation}</p>
            </div>
          </div>

          {/* Code Snippet Panel */}
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">DFS Algorithm</h2>
            <div className="font-mono text-sm bg-gray-900/70 p-4 rounded-lg overflow-x-auto">
              {codeSnippet.map((line, index) => (
                <div
                  key={index}
                  className={`py-1 px-2 ${activeLine === index ? 'bg-purple-900/50 text-cyan-300' : 'text-gray-300'}`}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Time Complexity</h3>
              <p className="text-gray-300">O(V + E)</p>
              <p className="text-sm text-gray-500">V = vertices, E = edges</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Space Complexity</h3>
              <p className="text-gray-300">O(V)</p>
              <p className="text-sm text-gray-500">Stack + visited array</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg md:col-span-2">
              <h3 className="text-lg text-cyan-400 mb-2">Applications</h3>
              <ul className="text-sm text-gray-300 list-disc list-inside">
                <li>Topological sorting</li>
                <li>Solving puzzles and mazes</li>
                <li>Path finding and cycle detection</li>
                <li>Strongly connected components</li>
              </ul>
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

export default DFSVisualizer;