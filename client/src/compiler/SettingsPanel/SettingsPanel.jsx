// components/SettingsPanel/SettingsPanel.jsx
import React from 'react';

const SettingsPanel = ({ 
  theme, 
  setTheme, 
  fontSize, 
  setFontSize, 
  fontFamily, 
  setFontFamily,
  onClose 
}) => {
  const fontOptions = [
    { value: 'monospace', label: 'Monospace' },
    { value: 'Fira Code', label: 'Fira Code' },
    { value: 'JetBrains Mono', label: 'JetBrains Mono' },
    { value: 'Consolas', label: 'Consolas' },
    { value: 'Courier New', label: 'Courier New' }
  ];
  
  const colorSchemes = [
    { value: 'dracula', label: 'Dracula' },
    { value: 'solarized', label: 'Solarized' },
    { value: 'one-dark', label: 'One Dark' },
    { value: 'material', label: 'Material' },
    { value: 'nord', label: 'Nord' }
  ];

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
    localStorage.setItem('theme', e.target.value);
  };

  const handleFontSizeChange = (e) => {
    setFontSize(parseInt(e.target.value));
    localStorage.setItem('fontSize', e.target.value);
  };

  const handleFontFamilyChange = (e) => {
    setFontFamily(e.target.value);
    localStorage.setItem('fontFamily', e.target.value);
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-2xl">Editor Settings</h3>
          <button className="btn btn-sm btn-circle" onClick={onClose}>✕</button>
        </div>
        
        <div className="space-y-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Theme</span>
            </label>
            <div className="flex gap-4">
              <label className="cursor-pointer label justify-start gap-2">
                <input 
                  type="radio" 
                  name="theme" 
                  value="dark" 
                  checked={theme === 'dark'} 
                  onChange={handleThemeChange}
                  className="radio radio-primary"
                />
                <span className="label-text">Dark</span>
              </label>
              <label className="cursor-pointer label justify-start gap-2">
                <input 
                  type="radio" 
                  name="theme" 
                  value="light" 
                  checked={theme === 'light'} 
                  onChange={handleThemeChange}
                  className="radio radio-primary"
                />
                <span className="label-text">Light</span>
              </label>
            </div>
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text">Font Family</span>
            </label>
            <select 
              className="select select-bordered"
              value={fontFamily} 
              onChange={handleFontFamilyChange}
            >
              {fontOptions.map(font => (
                <option key={font.value} value={font.value}>{font.label}</option>
              ))}
            </select>
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text">Font Size: {fontSize}px</span>
            </label>
            <input
              type="range"
              min="10"
              max="24"
              value={fontSize}
              onChange={handleFontSizeChange}
              className="range range-primary"
            />
            <div className="w-full flex justify-between text-xs px-2">
              <span>10</span>
              <span>14</span>
              <span>18</span>
              <span>22</span>
              <span>24</span>
            </div>
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text">Color Scheme</span>
            </label>
            <select className="select select-bordered">
              {colorSchemes.map(scheme => (
                <option key={scheme.value} value={scheme.value}>{scheme.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="modal-action">
          <button className="btn btn-primary" onClick={onClose}>Save & Close</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;