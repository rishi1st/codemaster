// components/LanguageSelector/LanguageSelector.jsx
import React from 'react';

const LanguageSelector = ({ language, setLanguage, languages }) => {
  const handleLanguageChange = (e) => {
    const selectedId = parseInt(e.target.value);
    const selectedLang = languages.find(lang => lang.id === selectedId);
    if (selectedLang) {
      setLanguage(selectedLang);
    }
  };

  return (
    <div className="form-control">
      <select 
        className="select select-bordered select-sm"
        value={language.id} 
        onChange={handleLanguageChange}
      >
        {languages.map(lang => (
          <option key={lang.id} value={lang.id}>
            {lang.name} {lang.icon}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;