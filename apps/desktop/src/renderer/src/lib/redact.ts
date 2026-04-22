/**
 * Client-side redaction helpers for the Report dialog preview.
 *
 * Must match shape of diagnostic-summary.ts:PATH_REGEX / URL_REGEX /
 * PROMPT_INLINE_REGEX — failure to match is a privacy bug. The preview shown
 * to users in the renderer has to line up with what the main process will
 * actually write into summary.md; otherwise users will approve a preview that
 * differs from the submitted bundle.
 */

const PROMPT_INLINE_REGEX =
  /(\bprompt\b\s*[":]\s*)("(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`|'(?:[^'\\]|\\.)*')/g;
const PATH_REGEX =
  /(?:(?:[A-Za-z]:\\|\\\\)[^\s'"<>`]+|(?:[/\\](?:Users|home|root|opt|Applications|var|tmp|etc|private))[/\\][^\s'"<>`]+|~[/\\][^\s'"<>`]+)/g;
const URL_REGEX = /(?:https?|wss?|file):\/\/[^\s'"<>]+/g;

export function scrubPromptInLine(s: string): string {
  return s.replace(PROMPT_INLINE_REGEX, (_, prefix) => `${prefix}"<redacted prompt>"`);
}

export function redactPaths(s: string): string {
  return s.replace(PATH_REGEX, '<redacted path>');
}

export function redactUrls(s: string): string {
  return s.replace(URL_REGEX, '<redacted url>');
}

export interface RedactOpts {
  includePromptText: boolean;
  includePaths: boolean;
  includeUrls: boolean;
}

export function applyRedaction(text: string, opts: RedactOpts): string {
  let out = text;
  if (!opts.includePromptText) out = scrubPromptInLine(out);
  if (!opts.includePaths) out = redactPaths(out);
  if (!opts.includeUrls) out = redactUrls(out);
  return out;
}
