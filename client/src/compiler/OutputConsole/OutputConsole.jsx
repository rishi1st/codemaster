// components/OutputConsole/OutputConsole.jsx
import React from 'react';

const OutputConsole = ({ output, error, executionTime, memoryUsage, activeTab, setActiveTab, isLoading }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'output':
        return (
          <pre className="whitespace-pre-wrap font-mono p-4 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <span className="loading loading-spinner loading-lg"></span>
                <span className="ml-2">Running code...</span>
              </div>
            ) : output ? (
              output
            ) : (
              'No output yet. Run your code to see results.'
            )}
          </pre>
        );
      case 'error':
        return (
          <pre className="whitespace-pre-wrap font-mono p-4 text-error overflow-auto">
            {error || 'No errors.'}
          </pre>
        );
      case 'info':
        return (
          <div className="p-4 overflow-auto">
            {executionTime && (
              <div className="mb-2">
                <span className="font-semibold">Execution Time:</span> 
                <span className="ml-2 badge badge-success">{executionTime}</span>
              </div>
            )}
            {memoryUsage && (
              <div className="mb-2">
                <span className="font-semibold">Memory Usage:</span> 
                <span className="ml-2 badge badge-info">{memoryUsage}</span>
              </div>
            )}
            {!executionTime && !memoryUsage && (
              <p>No execution data available. Run your code to see metrics.</p>
            )}
          </div>
        );
      default:
        return <pre className="whitespace-pre-wrap font-mono p-4">{output || 'No output yet.'}</pre>;
    }
  };

  return (
    <div className="card bg-base-200 shadow-xl h-full">
      <div className="card-body p-0 h-full flex flex-col">
        <div className="tabs tabs-boxed bg-base-300 px-2 pt-2">
          <a 
            className={`tab ${activeTab === 'output' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('output')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Output
          </a>
          <a 
            className={`tab ${activeTab === 'error' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('error')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Error
          </a>
          <a 
            className={`tab ${activeTab === 'info' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Info
          </a>
        </div>
        
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default OutputConsole;