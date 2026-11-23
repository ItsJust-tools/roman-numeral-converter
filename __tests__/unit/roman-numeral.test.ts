import { describe, it, expect } from 'vitest';
import {
  romanNumeralTool,
  numberToRoman,
  romanToNumber,
  parseInteger,
  convert,
} from '../../src/tool/tool-definition';
import { DEFAULT_STATE, MAX_ROMAN, MIN_ROMAN } from '../../src/tool/types';
import type { ToolState } from '../../src/tool/types';

const state = (patch: Partial<ToolState> = {}): ToolState => ({ ...DEFAULT_STATE, ...patch });

describe('numberToRoman', () => {
  it('converts basic values', () => {
    expect(numberToRoman(1)).toBe('I');
    expect(numberToRoman(4)).toBe('IV');
    expect(numberToRoman(9)).toBe('IX');
    expect(numberToRoman(14)).toBe('XIV');
    expect(numberToRoman(40)).toBe('XL');
    expect(numberToRoman(90)).toBe('XC');
    expect(numberToRoman(400)).toBe('CD');
    expect(numberToRoman(3999)).toBe('MMMCMXCIX');
  });

  it('converts other samples', () => {
    expect(numberToRoman(1987)).toBe('MCMLXXXVII');
    expect(numberToRoman(2024)).toBe('MMXXIV');
    expect(numberToRoman(1000)).toBe('M');
    expect(numberToRoman(3888)).toBe('MMMDCCCLXXXVIII');
  });

  it('rejects out-of-range and non-integer values', () => {
    expect(numberToRoman(0)).toBeNull();
    expect(numberToRoman(4000)).toBeNull();
    expect(numberToRoman(-5)).toBeNull();
    expect(numberToRoman(3.5)).toBeNull();
    expect(numberToRoman(NaN)).toBeNull();
    expect(numberToRoman(Infinity)).toBeNull();
  });

  it('supports boundary values', () => {
    expect(numberToRoman(MIN_ROMAN)).toBe('I');
    expect(numberToRoman(MAX_ROMAN)).toBe('MMMCMXCIX');
  });
});

describe('romanToNumber', () => {
  it('parses valid numerals in upper and lower case', () => {
    expect(romanToNumber('XIV')).toEqual({ value: 14, error: null });
    expect(romanToNumber('xiv')).toEqual({ value: 14, error: null });
    expect(romanToNumber('McMlXXXvIi')).toEqual({ value: 1987, error: null });
    expect(romanToNumber('  mmmcmxcix  ')).toEqual({ value: 3999, error: null });
  });

  it('accepts empty input with a helpful error rather than throwing', () => {
    const result = romanToNumber('');
    expect(result.value).toBeNull();
    expect(result.error).toMatch(/enter a roman numeral/i);
  });

  it('rejects invalid characters with a helpful error', () => {
    const result = romanToNumber('XIA');
    expect(result.value).toBeNull();
    expect(result.error).toMatch(/"A" is not a valid/i);
  });

  it('rejects four repeats (MMMM, IIII)', () => {
    for (const bad of ['MMMM', 'IIII', 'XXXX']) {
      const result = romanToNumber(bad);
      expect(result.value).toBeNull();
      expect(result.error).toMatch(/repeats more than three times/i);
    }
  });

  it('rejects invalid subtractive pairs (IL)', () => {
    const result = romanToNumber('IL');
    expect(result.value).toBeNull();
    expect(result.error).toMatch(/not a valid subtractive combination/i);
  });

  it('rejects non-canonical forms (IVII, IXI)', () => {
    for (const bad of ['IVII', 'IXI', 'VX', 'IC']) {
      const result = romanToNumber(bad);
      expect(result.value).toBeNull();
      expect(result.error).not.toBeNull();
    }
  });
});

describe('parseInteger', () => {
  it('parses digit strings', () => {
    expect(parseInteger('42')).toBe(42);
    expect(parseInteger(' 7 ')).toBe(7);
    expect(parseInteger('0')).toBe(0);
  });

  it('rejects malformed input', () => {
    expect(parseInteger('')).toBeNull();
    expect(parseInteger('abc')).toBeNull();
    expect(parseInteger('12.5')).toBeNull();
    expect(parseInteger('-3')).toBeNull();
    expect(parseInteger('1e3')).toBeNull();
  });
});

describe('convert (bidirectional state)', () => {
  it('converts number to roman', () => {
    expect(convert(state({ direction: 'number', numberInput: '14' }))).toEqual({
      value: 'XIV',
      error: null,
    });
  });

  it('converts roman to number', () => {
    expect(convert(state({ direction: 'roman', romanInput: 'xiv' }))).toEqual({
      value: '14',
      error: null,
    });
  });

  it('reports out-of-range numbers (0, 4000)', () => {
    expect(convert(state({ direction: 'number', numberInput: '0' })).error).toMatch(
      /out of range/i
    );
    expect(convert(state({ direction: 'number', numberInput: '4000' })).error).toMatch(
      /out of range/i
    );
  });

  it('reports invalid roman input', () => {
    expect(convert(state({ direction: 'roman', romanInput: 'IL' })).error).toMatch(/subtractive/i);
    expect(convert(state({ direction: 'roman', romanInput: '' })).error).toMatch(/enter a roman/i);
  });

  it('shows no error for empty number input (idle state)', () => {
    const result = convert(state({ direction: 'number', numberInput: '' }));
    expect(result.error).toBeNull();
    expect(result.value).toBe('');
  });
});

describe('serialize/deserialize roundtrip', () => {
  it('roundtrips a full state', () => {
    const original: ToolState = {
      direction: 'roman',
      numberInput: '1987',
      romanInput: 'mcmlxxxvii',
    };
    const serialized = romanNumeralTool.serialize(original);
    const parsed = JSON.parse(serialized);
    const result = romanNumeralTool.deserialize(parsed);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(original);
    }
  });

  it('roundtrips the default state', () => {
    const result = romanNumeralTool.deserialize(
      JSON.parse(romanNumeralTool.serialize({ ...DEFAULT_STATE }))
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(DEFAULT_STATE);
    }
  });

  it('rejects invalid payloads', () => {
    expect(romanNumeralTool.deserialize(null).success).toBe(false);
    expect(romanNumeralTool.deserialize('nope').success).toBe(false);
    expect(
      romanNumeralTool.deserialize({ direction: 'sideways', numberInput: '', romanInput: '' })
        .success
    ).toBe(false);
    expect(romanNumeralTool.deserialize({ direction: 'number' }).success).toBe(false);
    expect(
      romanNumeralTool.deserialize({ direction: 'number', numberInput: 5, romanInput: '' }).success
    ).toBe(false);
  });

  it('fails with an error message on bad data', () => {
    const result = romanNumeralTool.deserialize({ nope: true });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/invalid data format/i);
    }
  });
});
