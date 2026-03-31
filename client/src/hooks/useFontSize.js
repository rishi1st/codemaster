import { useState, useCallback, useEffect } from 'react';

export const useFontSize = () => {
  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem('fontSize')) || 14;
  });

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  const increaseFontSize = useCallback(() => {
    setFontSize(prev => Math.min(prev + 1, 24));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize(prev => Math.max(prev - 1, 12));
  }, []);

  return { fontSize, increaseFontSize, decreaseFontSize };
};