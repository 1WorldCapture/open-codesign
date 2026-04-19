/**
 * Tweaks runtime — runs inside the sandbox iframe.
 *
 * Two responsibilities:
 *  1. On load, scan author stylesheets for `:root { --foo: ... }` declarations
 *     and post a `TWEAK_VARS_DETECTED` message to the parent. Type inference
 *     happens here so the renderer never has to re-parse CSS values.
 *  2. Listen for `TWEAK_VAR` messages from the parent and apply each via
 *     `documentElement.style.setProperty(name, value)` — no re-render.
 *
 * MVP scope (intentionally narrow):
 *  - Only `:root { ... }` selectors are scanned (no `:where(:root)`, no nested
 *    selectors, no `@media`-wrapped vars, no `:root.dark` overrides).
 *  - Cross-origin stylesheets are skipped silently (cssRules access throws).
 */

export type TweakVarType = 'color' | 'number' | 'boolean' | 'string';

export interface TweakVar {
  name: string;
  value: string;
  type: TweakVarType;
}

export function inferTweakType(value: string): TweakVarType {
  const trimmed = value.trim();
  if (/^(oklch|oklab|rgb|rgba|hsl|hsla|color)\(/i.test(trimmed)) return 'color';
  if (/^#[0-9a-f]{3,8}$/i.test(trimmed)) return 'color';
  if (/^[\d.]+(px|rem|em|%)$/.test(trimmed)) return 'number';
  if (trimmed === 'true' || trimmed === 'false') return 'boolean';
  return 'string';
}

export const TWEAKS_SCRIPT = `(function() {
  'use strict';

  function inferType(value) {
    var trimmed = String(value).trim();
    if (/^(oklch|oklab|rgb|rgba|hsl|hsla|color)\\(/i.test(trimmed)) return 'color';
    if (/^#[0-9a-f]{3,8}$/i.test(trimmed)) return 'color';
    if (/^[\\d.]+(px|rem|em|%)$/.test(trimmed)) return 'number';
    if (trimmed === 'true' || trimmed === 'false') return 'boolean';
    return 'string';
  }

  function collectVars() {
    var seen = Object.create(null);
    var out = [];
    var sheets = document.styleSheets;
    for (var i = 0; i < sheets.length; i++) {
      var rules;
      try { rules = sheets[i].cssRules; } catch (_) { continue; }
      if (!rules) continue;
      for (var j = 0; j < rules.length; j++) {
        var r = rules[j];
        if (!r || r.type !== 1) continue;
        var sel = r.selectorText || '';
        if (sel.indexOf(':root') === -1) continue;
        var style = r.style;
        if (!style) continue;
        for (var k = 0; k < style.length; k++) {
          var prop = style[k];
          if (prop.indexOf('--') !== 0) continue;
          if (seen[prop]) continue;
          seen[prop] = true;
          var val = style.getPropertyValue(prop).trim();
          if (!val) continue;
          out.push({ name: prop, value: val, type: inferType(val) });
        }
      }
    }
    return out;
  }

  function postVars() {
    try {
      var vars = collectVars();
      window.parent.postMessage({
        __codesign: true,
        type: 'TWEAK_VARS_DETECTED',
        vars: vars
      }, '*');
    } catch (_) {}
  }

  function onMessage(ev) {
    var data = ev && ev.data;
    if (!data || data.__codesign !== true || data.type !== 'TWEAK_VAR') return;
    var name = String(data.name || '');
    var value = String(data.value == null ? '' : data.value);
    if (name.indexOf('--') !== 0) return;
    try { document.documentElement.style.setProperty(name, value); } catch (_) {}
  }

  try { window.addEventListener('message', onMessage); } catch (_) {}

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(postVars, 0);
  } else {
    try { window.addEventListener('DOMContentLoaded', postVars); } catch (_) {}
  }
})();`;

export interface TweakVarsDetectedMessage {
  __codesign: true;
  type: 'TWEAK_VARS_DETECTED';
  vars: TweakVar[];
}

export function isTweakVarsDetectedMessage(data: unknown): data is TweakVarsDetectedMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { __codesign?: boolean }).__codesign === true &&
    (data as { type?: string }).type === 'TWEAK_VARS_DETECTED' &&
    Array.isArray((data as { vars?: unknown }).vars)
  );
}

export interface TweakVarMessage {
  __codesign: true;
  type: 'TWEAK_VAR';
  name: string;
  value: string;
}

export function buildTweakVarMessage(name: string, value: string): TweakVarMessage {
  return { __codesign: true, type: 'TWEAK_VAR', name, value };
}
