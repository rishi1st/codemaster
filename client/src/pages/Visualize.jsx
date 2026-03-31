import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import Navbar from '../components/Navbar';
import { Cpu, Brain } from 'lucide-react';

const Visualize = () => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(true);
  }, []);

  return (
    <>
      <Navbar />

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6 overflow-hidden relative">
        {/* Floating animated background circles */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-blue-500/10 animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 80 + 20}px`,
                height: `${Math.random() * 80 + 20}px`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${4 + Math.random() * 6}s`
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Header */}
          <h1
            className={`text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-4 transition-all duration-1000 ${
              animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            DSA Visualizer
          </h1>
          <p
            className={`text-lg md:text-xl text-gray-400 mb-12 transition-all duration-1000 delay-200 ${
              animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            Visualize Algorithms and Data Structures in action
          </p>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Algorithms Card */}
            <Link to="/algorithms">
              <div className="card bg-gray-900/70 border border-gray-700/40 shadow-xl hover:shadow-2xl hover:border-blue-500/50 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 backdrop-blur-md rounded-2xl">
                <div className="card-body items-center text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center mb-4">
                    <Cpu className="w-8 h-8 text-blue-400" />
                  </div>
                  <h2 className="card-title text-2xl font-bold text-white mb-2">
                    Algorithms Visualizer
                  </h2>
                  <p className="text-gray-400">
                    Step-by-step visualization of sorting, searching, graph, and dynamic programming algorithms
                  </p>
                </div>
              </div>
            </Link>

            {/* Data Structures Card */}
            <Link to="/data-structures">
              <div className="card bg-gray-900/70 border border-gray-700/40 shadow-xl hover:shadow-2xl hover:border-purple-500/50 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 backdrop-blur-md rounded-2xl">
                <div className="card-body items-center text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center mb-4">
                    <Brain className="w-8 h-8 text-purple-400" />
                  </div>
                  <h2 className="card-title text-2xl font-bold text-white mb-2">
                    Data Structures Visualizer
                  </h2>
                  <p className="text-gray-400">
                    Interactive visualization of arrays, stacks, queues, trees, graphs, and more
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Visualize;
