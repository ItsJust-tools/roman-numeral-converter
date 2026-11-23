'use client';

import { MAX_ROMAN, MIN_ROMAN } from '../types';

interface ToolSidebarProps {
  text?: string;
  fontSize?: number;
  onFontSizeChange?: (delta: number) => void;
}

export function ToolSidebar({ text, fontSize, onFontSizeChange }: ToolSidebarProps) {
  const chars = (text ?? '').replace(/\s/g, '').length;

  return (
    <div className="converter-sidebar">
      <div className="sidebar-section">
        <h3>Input Stats</h3>
        <dl className="stats-list">
          <div className="stat-row">
            <dt>Characters</dt>
            <dd>{chars.toLocaleString()}</dd>
          </div>
          <div className="stat-row">
            <dt>Font size</dt>
            <dd>
              <button
                type="button"
                aria-label="Decrease font size"
                onClick={() => onFontSizeChange?.(-2)}
                className="mr-2 rounded border border-gray-300 px-2 text-xs dark:border-gray-700"
              >
                A-
              </button>
              <span className="font-mono text-xs">{fontSize ?? 16}px</span>
              <button
                type="button"
                aria-label="Increase font size"
                onClick={() => onFontSizeChange?.(2)}
                className="ml-2 rounded border border-gray-300 px-2 text-xs dark:border-gray-700"
              >
                A+
              </button>
            </dd>
          </div>
          <div className="stat-row">
            <dt>Supported range</dt>
            <dd>
              {MIN_ROMAN}–{MAX_ROMAN}
            </dd>
          </div>
        </dl>
      </div>
      <div className="sidebar-section">
        <h3>Numeral reference</h3>
        <p className="text-xs leading-relaxed">
          Roman letters: I=1, V=5, X=10, L=50, C=100, D=500, M=1000. Subtractive pairs: IV, IX, XL,
          XC, CD, CM. Lower-case input is accepted; output is upper-case.
        </p>
      </div>
    </div>
  );
}
