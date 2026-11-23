'use client';

import React from 'react';
import type { ToolState } from '../types';

interface SidebarProps {
  state: ToolState;
  onChange: (state: ToolState) => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  return (
    <div
      className="p-4 space-y-6 text-sm overflow-y-auto h-full"
      data-testid="roman-converter-sidebar"
    >
      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">How it works</h3>
        <ul className="list-disc pl-4 space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <li>Type a number (1–3999) to get its Roman numeral instantly.</li>
          <li>Switch direction to type a numeral and get the number.</li>
          <li>
            Lower-case input like <code>mcmlxxxvii</code> works; output is upper-case.
          </li>
          <li>Invalid numerals (IL, IVII, MMMM, IIII) are rejected with an explanation.</li>
        </ul>
      </div>
      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Subtractive rules</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Only these subtractive combinations are valid: IV, IX, XL, XC, CD, CM. A smaller numeral
          before a larger one must be one of these pairs.
        </p>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Roman numerals classically represent 1–3999 without overbar notation.
      </p>
    </div>
  );
};
