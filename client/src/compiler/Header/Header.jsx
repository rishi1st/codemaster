import React, { useState, useEffect } from 'react';

const Header = ({ theme, toggleSettings, layout, changeLayout }) => {
  const [currentQuote, setCurrentQuote] = useState(0);
  
  const motivationalQuotes = [
    "Code is Poetry",
    "Create Something Amazing",
    "Dream in Code",
    "Build the Future",
    "Innovate & Iterate",
    "Code With Purpose",
    "Transform Ideas into Reality",
    "Debugging: The Art of Perfection",
    "Elegant Solutions to Complex Problems",
    "Where Logic Meets Creativity"
  ];

  // Rotate quotes every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % motivationalQuotes.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="navbar bg-gradient-to-r from-primary to-secondary text-primary-content shadow-lg sticky top-0 z-10">
      <div className="flex-1">
        <a className="btn btn-ghost text-xl">
          <span className="text-secondary-content animate-pulse">✨</span>
          <span className="ml-2 font-mono text-secondary-content hidden sm:inline-block overflow-hidden whitespace-nowrap transition-all duration-1000 ease-in-out">
            {motivationalQuotes[currentQuote]}
          </span>
        </a>
      </div>
      <div className="flex-none gap-2">
        <div className="dropdown dropdown-end">
          <div tabIndex="0" role="button" className="btn btn-ghost btn-circle text-secondary-content">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </div>
          <ul tabIndex="0" className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
            <li>
              <a className={layout === 'split' ? 'active' : ''} onClick={() => changeLayout('split')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                Split View
              </a>
            </li>
            <li>
              <a className={layout === 'editor' ? 'active' : ''} onClick={() => changeLayout('editor')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Editor Only
              </a>
            </li>
            <li>
              <a className={layout === 'output' ? 'active' : ''} onClick={() => changeLayout('output')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                Output Only
              </a>
            </li>
          </ul>
        </div>
        
        <button className="btn btn-ghost btn-circle text-secondary-content" onClick={toggleSettings}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        
        
      </div>
    </header>
  );
};

export default Header;