import { describe, expect, it } from 'vitest';
import { buildTweakVarMessage, inferTweakType, isTweakVarsDetectedMessage } from './tweaks-runtime';

describe('inferTweakType', () => {
  it('detects oklch / oklab / rgb / hsl / color() as color', () => {
    expect(inferTweakType('oklch(0.5 0.1 200)')).toBe('color');
    expect(inferTweakType('OKLAB(0.5 0.1 0.2)')).toBe('color');
    expect(inferTweakType('rgb(10, 20, 30)')).toBe('color');
    expect(inferTweakType('rgba(10, 20, 30, 0.5)')).toBe('color');
    expect(inferTweakType('hsl(120, 50%, 50%)')).toBe('color');
    expect(inferTweakType('color(display-p3 1 0 0)')).toBe('color');
  });

  it('detects hex colors as color', () => {
    expect(inferTweakType('#fff')).toBe('color');
    expect(inferTweakType('#abcdef')).toBe('color');
    expect(inferTweakType('#abcdef12')).toBe('color');
  });

  it('detects px / rem / em / % as number', () => {
    expect(inferTweakType('16px')).toBe('number');
    expect(inferTweakType('1.5rem')).toBe('number');
    expect(inferTweakType('2em')).toBe('number');
    expect(inferTweakType('50%')).toBe('number');
  });

  it('detects true / false as boolean', () => {
    expect(inferTweakType('true')).toBe('boolean');
    expect(inferTweakType('false')).toBe('boolean');
  });

  it('falls back to string for arbitrary text', () => {
    expect(inferTweakType('Inter, sans-serif')).toBe('string');
    expect(inferTweakType('cubic-bezier(0.16, 1, 0.3, 1)')).toBe('string');
    expect(inferTweakType('')).toBe('string');
  });

  it('handles surrounding whitespace', () => {
    expect(inferTweakType('  16px  ')).toBe('number');
    expect(inferTweakType('\n#abc\n')).toBe('color');
  });
});

describe('isTweakVarsDetectedMessage', () => {
  it('accepts well-formed messages', () => {
    expect(
      isTweakVarsDetectedMessage({
        __codesign: true,
        type: 'TWEAK_VARS_DETECTED',
        vars: [],
      }),
    ).toBe(true);
  });

  it('rejects unrelated payloads', () => {
    expect(isTweakVarsDetectedMessage(null)).toBe(false);
    expect(isTweakVarsDetectedMessage({ type: 'TWEAK_VARS_DETECTED', vars: [] })).toBe(false);
    expect(isTweakVarsDetectedMessage({ __codesign: true, type: 'OTHER', vars: [] })).toBe(false);
    expect(isTweakVarsDetectedMessage({ __codesign: true, type: 'TWEAK_VARS_DETECTED' })).toBe(
      false,
    );
  });
});

describe('buildTweakVarMessage', () => {
  it('produces the expected envelope', () => {
    expect(buildTweakVarMessage('--accent', '#ff0000')).toEqual({
      __codesign: true,
      type: 'TWEAK_VAR',
      name: '--accent',
      value: '#ff0000',
    });
  });
});
