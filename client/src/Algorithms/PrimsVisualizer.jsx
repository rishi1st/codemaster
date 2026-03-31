import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, StepForward, StepBack, RefreshCw, Plus, Minus } from 'lucide-react';

const PrimsVisualizer = () => {
  // State management
  const [graph, setGraph] = useState({
    nodes: [],
    edges: [],
    adjacencyList: {}
  });
  const [searching, setSearching] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [speed, setSpeed] = useState(50);
  const [includedEdges, setIncludedEdges] = useState(new Set());
  const [inTree, setInTree] = useState(new Set());
  const [currentEdge, setCurrentEdge] = useState(null);
  const [priorityQueue, setPriorityQueue] = useState([]);
  const [newNodeId, setNewNodeId] = useState('');
  const [edgeFrom, setEdgeFrom] = useState('');
  const [edgeTo, setEdgeTo] = useState('');
  const [edgeWeight, setEdgeWeight] = useState(1);
  const [graphSize, setGraphSize] = useState(5);
  const [explanation, setExplanation] = useState('');
  const [mstWeight, setMstWeight] = useState(0);
  const [startNode, setStartNode] = useState('');
  const [codeSnippet] = useState([
    "Prim(G, start):",
    "  initialize MST = []",
    "  add start to MST",
    "  add all edges from start to PQ",
    "  while PQ not empty:",
    "    edge = extractMin(PQ)",
    "    if node not in MST:",
    "      add edge to MST",
    "      add node to MST",
    "      add node's edges to PQ",
    "  return MST"
  ]);
  const [activeLine, setActiveLine] = useState(-1);

  // Refs
  const searchInterval = useRef(null);
  const svgRef = useRef(null);

  // Initialize graph
  useEffect(() => {
    generateRandomGraph(graphSize);
  }, [graphSize]);

  // Generate random graph with weights
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

    // Create random edges (ensure connectivity for MST)
    const usedPairs = new Set();
    
    // First create a spanning tree to ensure connectivity
    for (let i = 1; i < size; i++) {
      const from = nodes[Math.floor(Math.random() * i)].id;
      const to = nodes[i].id;
      const weight = Math.floor(Math.random() * 10) + 1;
      
      edges.push({ from, to, weight });
      adjacencyList[from].push({ node: to, weight });
      adjacencyList[to].push({ node: from, weight });
      usedPairs.add(`${from}-${to}`);
      usedPairs.add(`${to}-${from}`);
    }

    // Add additional random edges
    for (let i = 0; i < size; i++) {
      const from = nodes[Math.floor(Math.random() * size)].id;
      const to = nodes[Math.floor(Math.random() * size)].id;
      const weight = Math.floor(Math.random() * 10) + 1;
      
      if (from !== to && !usedPairs.has(`${from}-${to}`)) {
        edges.push({ from, to, weight });
        adjacencyList[from].push({ node: to, weight });
        adjacencyList[to].push({ node: from, weight });
        usedPairs.add(`${from}-${to}`);
        usedPairs.add(`${to}-${from}`);
      }
    }

    const newStartNode = nodes[0].id;
    setGraph({ nodes, edges, adjacencyList });
    setStartNode(newStartNode);
    resetSearch();
    setExplanation(`Random connected graph with ${size} nodes generated. Starting from node ${newStartNode}.`);
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

  // Add an edge with weight
  const addEdge = () => {
    if (!edgeFrom || !edgeTo || !edgeWeight) {
      setExplanation('Please enter both nodes and a weight.');
      return;
    }

    const from = edgeFrom.toUpperCase();
    const to = edgeTo.toUpperCase();
    const weight = parseInt(edgeWeight);

    if (!graph.adjacencyList[from] || !graph.adjacencyList[to]) {
      setExplanation('One or both nodes do not exist.');
      return;
    }

    if (from === to) {
      setExplanation('Self-loops are not supported.');
      return;
    }

    if (graph.edges.find(e => 
      (e.from === from && e.to === to) || (e.from === to && e.to === from))) {
      setExplanation('Edge already exists.');
      return;
    }

    if (weight <= 0) {
      setExplanation('Weight must be positive.');
      return;
    }

    const newEdge = { from, to, weight };
    const newEdges = [...graph.edges, newEdge];
    const newAdjacencyList = { ...graph.adjacencyList };
    
    newAdjacencyList[from].push({ node: to, weight });
    newAdjacencyList[to].push({ node: from, weight });

    setGraph(prev => ({
      ...prev,
      edges: newEdges,
      adjacencyList: newAdjacencyList
    }));

    setEdgeFrom('');
    setEdgeTo('');
    setEdgeWeight(1);
    setExplanation(`Edge ${from} — ${to} with weight ${weight} added.`);
  };

  // Remove a node and its edges
  const removeNode = (nodeId) => {
    const newNodes = graph.nodes.filter(n => n.id !== nodeId);
    const newEdges = graph.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
    const newAdjacencyList = { ...graph.adjacencyList };
    delete newAdjacencyList[nodeId];

    // Remove references to the deleted node
    Object.keys(newAdjacencyList).forEach(key => {
      newAdjacencyList[key] = newAdjacencyList[key].filter(edge => edge.node !== nodeId);
    });

    setGraph({
      nodes: newNodes,
      edges: newEdges,
      adjacencyList: newAdjacencyList
    });

    if (startNode === nodeId) {
      setStartNode(newNodes[0]?.id || '');
    }
    setExplanation(`Node ${nodeId} removed from the graph.`);
  };

  // Reset search
  const resetSearch = () => {
    clearInterval(searchInterval.current);
    setSearching(false);
    setCurrentStep(0);
    setSteps([]);
    setIncludedEdges(new Set());
    setInTree(new Set());
    setCurrentEdge(null);
    setPriorityQueue([]);
    setMstWeight(0);
    setActiveLine(-1);
  };

  // Generate Prim's algorithm steps
  const generatePrimsSteps = () => {
    if (graph.nodes.length === 0 || !startNode) {
      setExplanation('Graph is empty or no start node selected.');
      return [];
    }

    const newSteps = [];
    const mstEdges = [];
    let totalWeight = 0;
    const inTreeSet = new Set([startNode]);
    const pq = [];
    let stepCount = 0;

    // Add initial edges from start node
    graph.adjacencyList[startNode]?.forEach(edge => {
      pq.push({ from: startNode, to: edge.node, weight: edge.weight });
    });
    
    // Sort initial priority queue
    pq.sort((a, b) => a.weight - b.weight);

    // Initial state
    newSteps.push({
      inTree: new Set(inTreeSet),
      priorityQueue: [...pq],
      includedEdges: new Set(),
      currentEdge: null,
      mstWeight: 0,
      explanation: `Step ${++stepCount}: Start from node ${startNode}. Added ${pq.length} edges to priority queue.`,
      line: 1
    });

    while (pq.length > 0 && inTreeSet.size < graph.nodes.length) {
      // Get minimum edge
      const minEdge = pq.shift();
      
      // Check current edge
      newSteps.push({
        inTree: new Set(inTreeSet),
        priorityQueue: [...pq],
        includedEdges: new Set(mstEdges.map(e => `${e.from}-${e.to}`)),
        currentEdge: minEdge,
        mstWeight: totalWeight,
        explanation: `Step ${++stepCount}: Considering edge ${minEdge.from}-${minEdge.to} (weight ${minEdge.weight}).`,
        line: 5
      });

      if (!inTreeSet.has(minEdge.to)) {
        // Add to MST
        mstEdges.push(minEdge);
        totalWeight += minEdge.weight;
        inTreeSet.add(minEdge.to);

        // Add new edges to priority queue
        graph.adjacencyList[minEdge.to]?.forEach(edge => {
          if (!inTreeSet.has(edge.node)) {
            pq.push({ from: minEdge.to, to: edge.node, weight: edge.weight });
          }
        });
        
        // Re-sort priority queue
        pq.sort((a, b) => a.weight - b.weight);

        newSteps.push({
          inTree: new Set(inTreeSet),
          priorityQueue: [...pq],
          includedEdges: new Set(mstEdges.map(e => `${e.from}-${e.to}`)),
          currentEdge: minEdge,
          mstWeight: totalWeight,
          explanation: `Step ${++stepCount}: Added edge to MST. Node ${minEdge.to} now in tree. Added ${graph.adjacencyList[minEdge.to]?.length || 0} new edges to queue.`,
          line: 8
        });
      } else {
        newSteps.push({
          inTree: new Set(inTreeSet),
          priorityQueue: [...pq],
          includedEdges: new Set(mstEdges.map(e => `${e.from}-${e.to}`)),
          currentEdge: minEdge,
          mstWeight: totalWeight,
          explanation: `Step ${++stepCount}: Skipped - node ${minEdge.to} already in MST.`,
          line: 6
        });
      }
    }

    // Final state
    newSteps.push({
      inTree: new Set(inTreeSet),
      priorityQueue: [],
      includedEdges: new Set(mstEdges.map(e => `${e.from}-${e.to}`)),
      currentEdge: null,
      mstWeight: totalWeight,
      explanation: `Prim's algorithm completed! MST weight: ${totalWeight}. Tree includes ${inTreeSet.size} nodes.`,
      line: 10
    });

    setSteps(newSteps);
    return newSteps;
  };

  // Start Prim's algorithm
  const startPrims = () => {
    if (searching) {
      clearInterval(searchInterval.current);
      setSearching(false);
      return;
    }

    if (steps.length === 0 || currentStep === steps.length - 1) {
      const newSteps = generatePrimsSteps();
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
      const newSteps = generatePrimsSteps();
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
      setCurrentEdge(step.currentEdge);
      setIncludedEdges(step.includedEdges);
      setInTree(step.inTree);
      setPriorityQueue(step.priorityQueue);
      setMstWeight(step.mstWeight);
      setExplanation(step.explanation);
      setActiveLine(step.line);
    }
  }, [currentStep, steps]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => clearInterval(searchInterval.current);
  }, []);

  // Get edge color based on state
  const getEdgeColor = (edge) => {
    const edgeKey = `${edge.from}-${edge.to}`;
    const reverseKey = `${edge.to}-${edge.from}`;
    
    if (currentEdge && (edge.from === currentEdge.from && edge.to === currentEdge.to)) {
      return '#F59E0B'; // Current edge being considered (orange)
    }
    if (includedEdges.has(edgeKey) || includedEdges.has(reverseKey)) {
      return '#10B981'; // Included in MST (green)
    }
    return '#6B7280'; // Not yet considered (gray)
  };

  // Get node color based on whether it's in the tree
  const getNodeColor = (nodeId) => {
    if (inTree.has(nodeId)) {
      return 'bg-green-500'; // In MST
    }
    if (nodeId === startNode) {
      return 'bg-blue-500'; // Start node
    }
    return 'bg-gray-600'; // Not in MST
  };

  return (
    <div className="pt-22 min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6 overflow-x-hidden relative">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-indigo-500/10 animate-pulse"
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
              className="absolute text-purple-400/30 text-xs animate-drop"
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
          <h1 className="text-4xl font-bold text-white mb-2">Prim's Algorithm</h1>
          <p className="text-lg text-gray-300">
            Prim's algorithm finds a minimum spanning tree by growing the tree from a starting node, always adding the minimum weight edge that connects to a new node.
            <span className="ml-2 text-cyan-400">Time Complexity: O(E log V) with priority queue</span>
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
              <label className="text-gray-300 text-sm">Add Edge (with weight):</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={edgeFrom}
                  onChange={(e) => setEdgeFrom(e.target.value)}
                  placeholder="From"
                  className="flex-1 input input-bordered bg-gray-700/50 border-gray-600 text-white"
                  maxLength={1}
                />
                <input
                  type="text"
                  value={edgeTo}
                  onChange={(e) => setEdgeTo(e.target.value)}
                  placeholder="To"
                  className="flex-1 input input-bordered bg-gray-700/50 border-gray-600 text-white"
                  maxLength={1}
                />
                <input
                  type="number"
                  value={edgeWeight}
                  onChange={(e) => setEdgeWeight(e.target.value)}
                  placeholder="Wt"
                  className="w-16 input input-bordered bg-gray-700/50 border-gray-600 text-white"
                  min="1"
                />
                <button 
                  onClick={addEdge}
                  className="btn bg-blue-600 hover:bg-blue-700 border-none text-white"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Start Node Selection */}
            <div className="flex flex-col space-y-2">
              <label className="text-gray-300 text-sm">Start Node:</label>
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
                onClick={startPrims}
                className="btn bg-green-600 hover:bg-green-700 border-none text-white"
                disabled={graph.nodes.length === 0 || !startNode}
              >
                {searching ? <Pause size={20} /> : <Play size={20} />}
                {searching ? 'Pause' : 'Play'}
              </button>
              <button 
                onClick={stepBackward}
                className="btn bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
                disabled={graph.nodes.length === 0 || !startNode}
              >
                <StepBack size={20} />
                Step Back
              </button>
              <button 
                onClick={stepForward}
                className="btn bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
                disabled={graph.nodes.length === 0 || !startNode}
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
                    startPrims();
                  }
                }}
                className="range range-xs range-primary w-32"
              />
              <span className="text-gray-300 text-sm">
                {speed < 33 ? 'Slow' : speed < 66 ? 'Medium' : 'Fast'}
              </span>
            </div>

            {/* Graph Info */}
            <div className="text-gray-300 text-sm">
              Nodes: {graph.nodes.length} | Edges: {graph.edges.length} | MST Weight: {mstWeight}
            </div>
          </div>
        </div>

        {/* Stats and Step Counter */}
        <div className="flex flex-wrap justify-between items-center mb-6 bg-gray-800/50 rounded-xl p-4 backdrop-blur-md">
          <div className="text-sm text-gray-300">
            <span className="mr-4">Step: {currentStep + 1} of {steps.length}</span>
            <span>Nodes in MST: {inTree.size} / {graph.nodes.length}</span>
            <span className="ml-4">MST Edges: {includedEdges.size}</span>
            <span className="ml-4">Total Weight: {mstWeight}</span>
          </div>
          
          <div className="flex items-center space-x-4 mt-2 md:mt-0">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
              <span className="text-xs text-gray-400">In MST</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
              <span className="text-xs text-gray-400">Start Node</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
              <span className="text-xs text-gray-400">Considering</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gray-600 mr-1"></div>
              <span className="text-xs text-gray-400">Not in MST</span>
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

                  // Calculate edge midpoint for weight label
                  const midX = (fromNode.x + toNode.x) / 2;
                  const midY = (fromNode.y + toNode.y) / 2;

                  return (
                    <g key={index}>
                      <line
                        x1={fromNode.x}
                        y1={fromNode.y}
                        x2={toNode.x}
                        y2={toNode.y}
                        stroke={getEdgeColor(edge)}
                        strokeWidth="3"
                        className="transition-all duration-300"
                      />
                      <rect
                        x={midX - 12}
                        y={midY - 8}
                        width="24"
                        height="16"
                        fill="#1F2937"
                        stroke={getEdgeColor(edge)}
                        strokeWidth="1"
                        rx="3"
                      />
                      <text
                        x={midX}
                        y={midY + 4}
                        textAnchor="middle"
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                        pointerEvents="none"
                      >
                        {edge.weight}
                      </text>
                    </g>
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
                      onClick={() => !searching && setStartNode(node.id)}
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

                    {/* Show if node is in MST */}
                    {inTree.has(node.id) && (
                      <text
                        x={node.x}
                        y={node.y - 30}
                        textAnchor="middle"
                        fill="#10B981"
                        fontSize="10"
                        fontWeight="bold"
                        pointerEvents="none"
                      >
                        in MST
                      </text>
                    )}

                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="20"
                      fill="transparent"
                      className="cursor-pointer"
                      onClick={() => !searching && removeNode(node.id)}
                    />
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Algorithm Status */}
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Algorithm Status</h2>
            <div className="h-80 bg-gray-900/50 rounded-lg border border-gray-700 p-4">
              <div className="text-gray-300 mb-2">Priority Queue (sorted by weight):</div>
              <div className="flex flex-col gap-1 max-h-24 overflow-y-auto mb-4">
                {priorityQueue.length === 0 ? (
                  <div className="text-gray-500 italic">Priority queue is empty</div>
                ) : (
                  priorityQueue.map((edge, index) => (
                    <div
                      key={index}
                      className={`px-2 py-1 rounded text-xs font-mono ${
                        index === 0 ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {edge.from}-{edge.to} (w: {edge.weight})
                    </div>
                  ))
                )}
              </div>
              
              <div className="text-gray-300 mb-2">Nodes in MST:</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {Array.from(inTree).length === 0 ? (
                  <div className="text-gray-500 italic">No nodes in MST yet</div>
                ) : (
                  Array.from(inTree).map((nodeId, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-white text-sm"
                    >
                      {nodeId}
                    </div>
                  ))
                )}
              </div>

              <div className="text-gray-300 mb-2">Edges in MST:</div>
              <div className="flex flex-wrap gap-2">
                {Array.from(includedEdges).length === 0 ? (
                  <div className="text-gray-500 italic">No edges in MST yet</div>
                ) : (
                  Array.from(includedEdges).map((edgeKey, index) => {
                    const [from, to] = edgeKey.split('-');
                    const edge = graph.edges.find(e => 
                      (e.from === from && e.to === to) || (e.from === to && e.to === from));
                    return (
                      <div
                        key={index}
                        className="px-2 py-1 rounded-full bg-green-500 flex items-center font-bold text-white text-xs"
                      >
                        {from}-{to} ({edge?.weight})
                      </div>
                    );
                  })
                )}
              </div>

              {currentEdge && (
                <div className="mt-4 p-3 bg-orange-900/30 rounded-lg">
                  <div className="text-orange-300 font-semibold">Currently Processing:</div>
                  <div className="text-white text-lg font-bold mt-1">
                    {currentEdge.from} — {currentEdge.to} (weight: {currentEdge.weight})
                  </div>
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
            <h2 className="text-xl font-semibold text-white mb-4">Prim's Algorithm</h2>
            <div className="font-mono text-sm bg-gray-900/70 p-4 rounded-lg overflow-x-auto">
              {codeSnippet.map((line, index) => (
                <div
                  key={index}
                  className={`py-1 px-2 ${activeLine === index ? 'bg-indigo-900/50 text-purple-300' : 'text-gray-300'}`}
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
              <p className="text-gray-300">O(E log V)</p>
              <p className="text-sm text-gray-500">With binary heap priority queue</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Space Complexity</h3>
              <p className="text-gray-300">O(V + E)</p>
              <p className="text-sm text-gray-500">For graph and priority queue</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Best For</h3>
              <p className="text-gray-300">Dense graphs</p>
              <p className="text-sm text-gray-500">When E ≈ V²</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg text-cyan-400 mb-2">Applications</h3>
              <ul className="text-sm text-gray-300 list-disc list-inside">
                <li>Network design</li>
                <li>Cluster analysis</li>
                <li>Image processing</li>
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

export default PrimsVisualizer;