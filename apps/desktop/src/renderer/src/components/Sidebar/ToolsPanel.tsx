import { useT } from '@open-codesign/i18n';
import { ChevronDown, FolderOpen, Link2, Paperclip, X } from 'lucide-react';
import { useState } from 'react';
import { useCodesignStore } from '../../store';

const CHIP_BTN =
  'inline-flex items-center gap-1.5 h-[28px] px-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors';

export function ToolsPanel() {
  const t = useT();
  const config = useCodesignStore((s) => s.config);
  const inputFiles = useCodesignStore((s) => s.inputFiles);
  const referenceUrl = useCodesignStore((s) => s.referenceUrl);
  const setReferenceUrl = useCodesignStore((s) => s.setReferenceUrl);
  const pickInputFiles = useCodesignStore((s) => s.pickInputFiles);
  const removeInputFile = useCodesignStore((s) => s.removeInputFile);
  const pickDesignSystemDirectory = useCodesignStore((s) => s.pickDesignSystemDirectory);
  const clearDesignSystem = useCodesignStore((s) => s.clearDesignSystem);

  const designSystem = config?.designSystem ?? null;
  const [urlOpen, setUrlOpen] = useState(referenceUrl.length > 0);

  return (
    <div className="px-4 pt-3 pb-2 border-b border-[var(--color-border-muted)] space-y-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => void pickInputFiles()}
          className={CHIP_BTN}
          title={t('sidebar.attachLocalFiles')}
        >
          <Paperclip className="w-3.5 h-3.5" />
          <span>{t('sidebar.attachLocalFiles')}</span>
          {inputFiles.length > 0 ? (
            <span className="ml-0.5 text-[10px] text-[var(--color-text-muted)]">
              · {inputFiles.length}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => void pickDesignSystemDirectory()}
          className={CHIP_BTN}
          title={
            designSystem ? t('sidebar.refreshDesignSystemRepo') : t('sidebar.linkDesignSystemRepo')
          }
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>
            {designSystem
              ? t('sidebar.refreshDesignSystemRepo')
              : t('sidebar.linkDesignSystemRepo')}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setUrlOpen((v) => !v)}
          className={CHIP_BTN}
          aria-expanded={urlOpen}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>{t('sidebar.referenceUrl')}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${urlOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {urlOpen ? (
        <input
          type="url"
          value={referenceUrl}
          onChange={(e) => setReferenceUrl(e.target.value)}
          placeholder="https://example.com/reference"
          className="w-full h-8 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-[12px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-focus-ring)] transition-[box-shadow,border-color] duration-150"
        />
      ) : null}

      {inputFiles.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {inputFiles.map((file) => (
            <span
              key={file.path}
              className="inline-flex items-center gap-1 max-w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[11px] text-[var(--color-text-secondary)]"
            >
              <span className="truncate max-w-[160px]" title={file.path}>
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => removeInputFile(file.path)}
                className="inline-flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                aria-label={t('sidebar.removeFile', { name: file.name })}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {designSystem ? (
        <div className="flex items-start justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-muted)] bg-[var(--color-surface)] px-2.5 py-1.5">
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-[var(--color-text-primary)]">
              {t('sidebar.activeDesignSystem')}
            </div>
            <div
              className="text-[10px] text-[var(--color-text-muted)] truncate"
              title={designSystem.rootPath}
            >
              {designSystem.rootPath}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void clearDesignSystem()}
            className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            {t('sidebar.clear')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
