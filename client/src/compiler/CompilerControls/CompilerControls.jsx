// components/CompilerControls/CompilerControls.jsx
import React from 'react';
import { useToast } from '../../contexts/ToastContext';

const CompilerControls = ({ 
  onRun, 
  onClear, 
  code, 
  language, 
  isLoading,
  userInput,
  setUserInput
}) => {
  const { showToast } = useToast();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    showToast('Code copied to clipboard!', 'success');
  };

  const handleDownloadCode = () => {
    const element = document.createElement('a');
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `code.${language.value}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('Code downloaded!', 'success');
  };

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <button 
            className="btn btn-primary flex-1 gap-2"
            onClick={onRun}
            disabled={isLoading || !code.trim()}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner"></span>
                Running...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Run Code
              </>
            )}
          </button>
          
          <button 
            className="btn btn-outline gap-2" 
            onClick={handleCopyCode}
            disabled={!code.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy
          </button>
          
          <button 
            className="btn btn-outline gap-2" 
            onClick={handleDownloadCode}
            disabled={!code.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          
          <button 
            className="btn btn-outline btn-error gap-2" 
            onClick={onClear}
            disabled={!code.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear
          </button>
        </div>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Input (stdin):</span>
          </label>
          <textarea
            className="textarea textarea-bordered h-24 font-mono"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter input for your program here..."
          />
        </div>
      </div>
    </div>
  );
};

export default CompilerControls;