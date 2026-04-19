import { useT } from '@open-codesign/i18n';
import { type TweakVar, buildTweakVarMessage } from '@open-codesign/runtime';
import { type ReactElement, useMemo } from 'react';
import { useCodesignStore } from '../store';

export interface TweaksPanelProps {
  iframeWindow: Window | null;
}

function postTweak(target: Window | null, name: string, value: string): void {
  if (!target) return;
  try {
    target.postMessage(buildTweakVarMessage(name, value), '*');
  } catch {
    // postMessage failed (iframe gone) — silent; next render will pick up.
  }
}

interface ControlProps {
  variable: TweakVar;
  onChange: (value: string) => void;
}

function ColorControl({ variable, onChange }: ControlProps): ReactElement {
  // <input type="color"> only accepts #rrggbb. oklch / rgb / hsl values can't
  // round-trip without a CSS Color Module 4 conversion library — kept out of
  // MVP per the lean budget. Show a hex picker only for hex sources; for
  // everything else fall back to a text field that still lives-edits.
  const isHex = /^#[0-9a-f]{3,8}$/i.test(variable.value.trim());
  if (isHex) {
    const normalized =
      variable.value.length === 4
        ? `#${variable.value
            .slice(1)
            .split('')
            .map((c) => c + c)
            .join('')}`
        : variable.value.slice(0, 7);
    return (
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={normalized}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-[var(--color-border)] bg-transparent p-0"
          aria-label={variable.name}
        />
        <input
          type="text"
          value={variable.value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-8 px-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--text-xs)] font-mono text-[var(--color-text-primary)]"
        />
      </div>
    );
  }
  return (
    <input
      type="text"
      value={variable.value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-8 px-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--text-xs)] font-mono text-[var(--color-text-primary)]"
      aria-label={variable.name}
    />
  );
}

function NumberControl({ variable, onChange }: ControlProps): ReactElement {
  const match = variable.value.match(/^([\d.]+)(px|rem|em|%)$/);
  const numeric = match ? Number.parseFloat(match[1] ?? '0') : 0;
  const unit = match?.[2] ?? 'px';
  const max = unit === '%' ? 100 : unit === 'px' ? 200 : 10;
  const step = unit === 'rem' || unit === 'em' ? 0.125 : 1;
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={numeric}
        onChange={(e) => onChange(`${e.target.value}${unit}`)}
        className="flex-1"
        aria-label={variable.name}
      />
      <input
        type="text"
        value={variable.value}
        onChange={(e) => onChange(e.target.value)}
        className="w-20 h-8 px-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--text-xs)] font-mono text-[var(--color-text-primary)]"
      />
    </div>
  );
}

function BooleanControl({ variable, onChange }: ControlProps): ReactElement {
  const checked = variable.value.trim() === 'true';
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
        className="h-4 w-4"
      />
      <span className="text-[var(--text-xs)] text-[var(--color-text-secondary)]">
        {variable.value}
      </span>
    </label>
  );
}

function StringControl({ variable, onChange }: ControlProps): ReactElement {
  return (
    <input
      type="text"
      value={variable.value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-8 px-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--text-xs)] font-mono text-[var(--color-text-primary)]"
      aria-label={variable.name}
    />
  );
}

export function TweaksPanel({ iframeWindow }: TweaksPanelProps): ReactElement {
  const t = useT();
  const tweaksVars = useCodesignStore((s) => s.tweaksVars);
  const updateTweakVar = useCodesignStore((s) => s.updateTweakVar);

  const grouped = useMemo(() => {
    const groups: Record<TweakVar['type'], TweakVar[]> = {
      color: [],
      number: [],
      boolean: [],
      string: [],
    };
    for (const v of tweaksVars) groups[v.type].push(v);
    return groups;
  }, [tweaksVars]);

  function handleChange(name: string, value: string): void {
    updateTweakVar(name, value);
    postTweak(iframeWindow, name, value);
  }

  function renderRow(v: TweakVar): ReactElement {
    let control: ReactElement;
    if (v.type === 'color') {
      control = <ColorControl variable={v} onChange={(val) => handleChange(v.name, val)} />;
    } else if (v.type === 'number') {
      control = <NumberControl variable={v} onChange={(val) => handleChange(v.name, val)} />;
    } else if (v.type === 'boolean') {
      control = <BooleanControl variable={v} onChange={(val) => handleChange(v.name, val)} />;
    } else {
      control = <StringControl variable={v} onChange={(val) => handleChange(v.name, val)} />;
    }
    return (
      <div key={v.name} className="flex flex-col gap-1">
        <label
          htmlFor={`tweak-${v.name}`}
          className="text-[var(--text-xs)] font-medium text-[var(--color-text-primary)] font-mono truncate"
          title={v.name}
        >
          {v.name}
        </label>
        {control}
      </div>
    );
  }

  const sections: Array<{ key: TweakVar['type']; label: string; items: TweakVar[] }> = [
    { key: 'color', label: t('preview.tweaks.color'), items: grouped.color },
    { key: 'number', label: t('preview.tweaks.size'), items: grouped.number },
    { key: 'boolean', label: t('preview.tweaks.boolean'), items: grouped.boolean },
    { key: 'string', label: t('preview.tweaks.string'), items: grouped.string },
  ];

  return (
    <aside
      aria-label={t('preview.tweaks.title')}
      className="w-72 shrink-0 border-l border-[var(--color-border-muted)] bg-[var(--color-background-secondary)] overflow-y-auto"
    >
      <header className="sticky top-0 z-10 px-4 py-3 border-b border-[var(--color-border-muted)] bg-[var(--color-background-secondary)]">
        <h2 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)]">
          {t('preview.tweaks.title')}
        </h2>
      </header>
      {tweaksVars.length === 0 ? (
        <p className="px-4 py-6 text-[var(--text-xs)] text-[var(--color-text-secondary)]">
          {t('preview.tweaks.empty')}
        </p>
      ) : (
        <div className="px-4 py-3 flex flex-col gap-5">
          {sections
            .filter((s) => s.items.length > 0)
            .map((section) => (
              <section key={section.key} className="flex flex-col gap-3">
                <h3 className="text-[var(--text-xs)] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {section.label}
                </h3>
                {section.items.map(renderRow)}
              </section>
            ))}
        </div>
      )}
    </aside>
  );
}
