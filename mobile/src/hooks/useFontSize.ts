import { useState, useEffect } from 'react';

export type FontSizeOption = 'small' | 'medium' | 'large' | 'xlarge';

const FONT_SIZE_KEY = 'campfire_mobile_font_size';

export function useFontSize() {
  const [fontSize, setFontSizeState] = useState<FontSizeOption>(() => {
    const saved = localStorage.getItem(FONT_SIZE_KEY) as FontSizeOption;
    if (saved === 'small' || saved === 'medium' || saved === 'large' || saved === 'xlarge') {
      return saved;
    }
    return 'medium';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    localStorage.setItem(FONT_SIZE_KEY, fontSize);
  }, [fontSize]);

  const setFontSize = (size: FontSizeOption) => {
    setFontSizeState(size);
  };

  return { fontSize, setFontSize };
}
