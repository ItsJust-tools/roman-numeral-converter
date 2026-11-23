import type { Tool, DeserializeResult } from '@itsjust/core';
import toolConfig from './tool.config';
import {
  DEFAULT_STATE,
  MAX_ROMAN,
  MIN_ROMAN,
  NUMERAL_TABLE,
  SUBTRACTIVE_PAIRS,
  type ConversionResult,
  type Direction,
  type ToolState,
} from './types';

const ROMAN_CHARS = new Set(['I', 'V', 'X', 'L', 'C', 'D', 'M']);

/**
 * Convert an integer in [MIN_ROMAN, MAX_ROMAN] to an upper-case Roman numeral.
 * Returns null for non-integers or out-of-range values.
 */
export function numberToRoman(value: number): string | null {
  if (!Number.isFinite(value) || !Number.isInteger(value)) return null;
  if (value < MIN_ROMAN || value > MAX_ROMAN) return null;
  let remaining = value;
  let result = '';
  for (const { value: v, numeral } of NUMERAL_TABLE) {
    while (remaining >= v) {
      result += numeral;
      remaining -= v;
    }
  }
  return result;
}

/**
 * Parse a Roman numeral string (upper or lower case, whitespace trimmed) to an
 * integer. Returns an object with either a value or a helpful error message
 * explaining exactly why the numeral is invalid.
 */
export function romanToNumber(input: string): { value: number | null; error: string | null } {
  const raw = input.trim();
  if (!raw) {
    return { value: null, error: 'Enter a Roman numeral (I–MMMCMXCIX)' };
  }
  const normalized = raw.toUpperCase();
  for (const char of normalized) {
    if (!ROMAN_CHARS.has(char)) {
      return {
        value: null,
        error: `"${char}" is not a valid Roman numeral character. Use I, V, X, L, C, D, M.`,
      };
    }
  }
  if (/(.)\1{3,}/.test(normalized)) {
    return {
      value: null,
      error: 'Invalid numeral: a character repeats more than three times (e.g. MMMM, IIII).',
    };
  }
  const values: number[] = normalized.split('').map((char) => CHAR_VALUES[char] ?? 0);
  let total = 0;
  for (let i = 0; i < values.length; i++) {
    const current: number = values[i] ?? 0;
    const next: number = i + 1 < values.length ? (values[i + 1] ?? 0) : 0;
    if (next > current) {
      const pair = `${normalized[i]}${normalized[i + 1]}`;
      if (!(SUBTRATIVE_PAIR_GUARD as ReadonlySet<string>).has(pair)) {
        return {
          value: null,
          error: `Invalid numeral: "${pair}" is not a valid subtractive combination (allowed: IV, IX, XL, XC, CD, CM).`,
        };
      }
      // Also reject invalid repeated subtractive prefixes like IVI / IXI handled below.
      total -= current;
    } else {
      total += current;
    }
  }
  // Verify by round-tripping: strict canonical form check.
  const canonical = numberToRoman(total);
  if (canonical === null) {
    return {
      value: null,
      error: `Invalid numeral: value ${total} is out of the supported range 1–3999.`,
    };
  }
  if (canonical !== normalized) {
    return {
      value: null,
      error: `Invalid numeral: "${raw}" parses to ${total}, which is written "${canonical}". Input must be canonical form.`,
    };
  }
  return { value: total, error: null };
}

const CHAR_VALUES: Record<string, number> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000,
};

const SUBTRATIVE_PAIR_GUARD = new Set<string>(SUBTRACTIVE_PAIRS);

/** Parse an integer string; returns null on empty or malformed input. */
export function parseInteger(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isSafeInteger(value) ? value : null;
}

/** Convert the state toward the inactive direction, with helpful error states. */
export function convert(state: ToolState): ConversionResult {
  if (state.direction === 'number') {
    const value = parseInteger(state.numberInput);
    if (value === null) {
      return {
        value: '',
        error: state.numberInput.trim()
          ? `"${state.numberInput.trim()}" is not a valid integer.`
          : null,
      };
    }
    if (value < MIN_ROMAN || value > MAX_ROMAN) {
      return {
        value: '',
        error: `Out of range: ${value}. Enter a number between 1 and 3999.`,
      };
    }
    return { value: numberToRoman(value) ?? '', error: null };
  }
  const { value, error } = romanToNumber(state.romanInput);
  if (error) return { value: '', error };
  return { value: String(value), error: null };
}

export const romanNumeralTool: Tool<ToolState> = {
  id: toolConfig.id,
  name: toolConfig.name,
  version: toolConfig.version,
  config: toolConfig,
  initialState: { ...DEFAULT_STATE },
  serialize: (state) => JSON.stringify(state),
  deserialize: (data): DeserializeResult<ToolState> => {
    if (typeof data !== 'object' || data === null) {
      return {
        success: false,
        error: 'Invalid data format: expected Roman numeral converter state object',
      };
    }
    const v = data as Partial<ToolState>;
    const directionOk = v.direction === 'number' || v.direction === 'roman';
    if (!directionOk || typeof v.numberInput !== 'string' || typeof v.romanInput !== 'string') {
      return {
        success: false,
        error:
          'Invalid data format: expected { direction: "number"|"roman", numberInput: string, romanInput: string }',
      };
    }
    return {
      success: true,
      data: {
        direction: v.direction as Direction,
        numberInput: v.numberInput as string,
        romanInput: v.romanInput as string,
      },
    };
  },
  exporters: [
    { format: 'png', loader: () => import('./exporters/png') },
    { format: 'jpeg', loader: () => import('./exporters/jpeg') },
    { format: 'webp', loader: () => import('./exporters/webp') },
    { format: 'pdf', loader: () => import('./exporters/pdf') },
  ],
};
