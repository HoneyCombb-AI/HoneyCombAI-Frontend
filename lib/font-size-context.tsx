"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  getFontSizeClass: () => string;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

const FONT_SIZE_STORAGE_KEY = 'honeycomb-font-size';

const fontSizeClasses = {
  'small': 'text-xs',
  'medium': 'text-sm',
  'large': 'text-base',
  'extra-large': 'text-lg'
};

const fontSizeLabels = {
  'small': 'Small',
  'medium': 'Default',
  'large': 'Large',
  'extra-large': 'Extra Large'
};

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedFontSize = localStorage.getItem(FONT_SIZE_STORAGE_KEY) as FontSize;
    if (savedFontSize && Object.keys(fontSizeClasses).includes(savedFontSize)) {
      setFontSizeState(savedFontSize);
    }
    setIsInitialized(true);
  }, []);

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, size);
  };

  const getFontSizeClass = () => {
    return fontSizeClasses[fontSize];
  };

  if (!isInitialized) {
    return null;
  }

  const value = {
    fontSize,
    setFontSize,
    getFontSizeClass
  };

  return (
    <FontSizeContext.Provider value={value}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
}

export { fontSizeLabels };