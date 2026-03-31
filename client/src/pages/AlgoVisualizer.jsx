import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import Navbar from '../components/Navbar';

const AlgoVisualizer = () => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(true);
  }, []);

  const categories = [
    {
      title: "🔹 Sorting Algorithms",
      algorithms: [
        "Bubble Sort", "Selection Sort", "Insertion Sort", 
        "Merge Sort", "Quick Sort", "Heap Sort"
      ]
    },
    {
      title: "🔹 Searching Algorithms",
      algorithms: [
        "Linear Search", "Binary Search"
      ]
    },
    {
      title: "🔹 Graph Algorithms",
      algorithms: [
        "BFS (Breadth First Search)", "DFS (Depth First Search)", 
        "Dijkstra's Algorithm", "Kruskal's Algorithm", "Prim's Algorithm"
      ]
    },
    {
      title: "🔹 Dynamic Programming",
      algorithms: [
        "Fibonacci (DP)", "Longest Common Subsequence", "Knapsack Problem"
      ]
    }
  ];

  return (
    <>
    
      <Navbar />

      <div className="pt-25 min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 px-4 sm:px-6 lg:px-8 py-10 sm:py-12 relative overflow-hidden">
        {/* Floating glowing background circles */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-purple-500/10 animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 70 + 20}px`,
                height: `${Math.random() * 70 + 20}px`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${4 + Math.random() * 6}s`
              }}
            />
          ))}
        </div>

        <div className=" pt-18 w-full max-w-7xl mx-auto relative z-10">
          {/* Page Title */}
          <h1
            className={`p-2 text-3xl sm:text-4xl md:text-5xl font-extrabold text-center bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-8 sm:mb-12 transition-all duration-1000 ${
              animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            Algorithm Visualizer
          </h1>

          {/* Responsive Algorithm Categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {categories.map((category, index) => (
              <div
                key={index}
                className="card bg-gray-900/70 border border-gray-700/40 shadow-xl hover:shadow-2xl hover:border-blue-500/50 transition-all duration-300 backdrop-blur-md rounded-2xl"
              >
                <div className="card-body p-4 sm:p-6">
                  <h2 className="card-title text-lg sm:text-xl font-semibold text-white mb-4">
                    {category.title}
                  </h2>

                  <div className="space-y-2 sm:space-y-3">
                    {category.algorithms.map((algorithm, algoIndex) => (
                      <Link
                        key={algoIndex}
                        to={`/algorithms/${algorithm.toLowerCase().replace(/\s+/g, '-')}`}
                        className="block p-2 sm:p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:text-white hover:bg-blue-600/20 hover:border-blue-500/50 transition-all duration-300 text-sm sm:text-base"
                      >
                        {algorithm}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      
    </>
  );
};

export default AlgoVisualizer;
