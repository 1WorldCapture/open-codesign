import { describe, expect, it } from 'vitest';
import { applyRedaction, redactPaths, redactUrls, scrubPromptInLine } from './redact';

describe('scrubPromptInLine', () => {
  it('replaces prompt values with a redaction placeholder', () => {
    const input = 'prompt: "design a meditation app"';
    expect(scrubPromptInLine(input)).toBe('prompt: "<redacted prompt>"');
  });
});

describe('redactPaths', () => {
  it('redacts absolute macOS user paths', () => {
    const input = 'Failed at /Users/alice/Documents/secret.md';
    expect(redactPaths(input)).toBe('Failed at <redacted path>');
  });
});

describe('redactUrls', () => {
  it('redacts https URLs', () => {
    const input = 'see https://example.com/foo/bar?x=1';
    expect(redactUrls(input)).toBe('see <redacted url>');
  });
});

describe('applyRedaction', () => {
  it('applies all three redactions when all flags are off', () => {
    const input = 'error: prompt: "hi" at /Users/alice/foo.ts — see https://example.com/bug';
    const result = applyRedaction(input, {
      includePromptText: false,
      includePaths: false,
      includeUrls: false,
    });
    expect(result).toBe(
      'error: prompt: "<redacted prompt>" at <redacted path> — see <redacted url>',
    );
  });

  it('honors include flags — passes input through untouched when all are on', () => {
    const input = 'prompt: "x" at /Users/a/b https://e.com';
    const result = applyRedaction(input, {
      includePromptText: true,
      includePaths: true,
      includeUrls: true,
    });
    expect(result).toBe(input);
  });

  it('handles empty string', () => {
    expect(
      applyRedaction('', {
        includePromptText: false,
        includePaths: false,
        includeUrls: false,
      }),
    ).toBe('');
  });
});
