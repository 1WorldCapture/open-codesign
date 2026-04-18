import { useT } from '@open-codesign/i18n';
import type { ChatMessage } from '@open-codesign/shared';
import { Check, Copy, RefreshCcw, Star } from 'lucide-react';
import { useState } from 'react';
import { useCodesignStore } from '../../store';

export interface AssistantMessageProps {
  message: ChatMessage;
  index: number;
}

const ACTION_BTN =
  'inline-flex items-center gap-1 h-[24px] px-2 rounded-md text-[11px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors';

export function AssistantMessage({ message, index }: AssistantMessageProps) {
  const t = useT();
  const isError = message.content.startsWith('Error:');
  const previewHtml = useCodesignStore((s) => s.previewHtml);
  const messages = useCodesignStore((s) => s.messages);
  const regenerate = useCodesignStore((s) => s.regenerateLast);
  const saveSnapshot = useCodesignStore((s) => s.saveSnapshot);
  const [copied, setCopied] = useState(false);
  const [snapped, setSnapped] = useState(false);

  const isLast = index === messages.length - 1;
  const hasArtifact = isLast && previewHtml !== null && !isError;

  async function copyArtifact(): Promise<void> {
    if (!previewHtml) return;
    try {
      await navigator.clipboard.writeText(previewHtml);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  }

  function snapshot(): void {
    saveSnapshot(index);
    setSnapped(true);
    window.setTimeout(() => setSnapped(false), 1500);
  }

  return (
    <div
      className={`px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-lg)] text-[var(--text-sm)] leading-[var(--leading-body)] break-words border ${
        isError
          ? 'bg-[var(--color-surface)] border-[var(--color-border-muted)] text-[var(--color-text-primary)]'
          : 'bg-[var(--color-surface)] border-[var(--color-border-muted)] text-[var(--color-text-primary)]'
      }`}
    >
      <div className="whitespace-pre-wrap">{message.content}</div>

      {hasArtifact ? (
        <div className="mt-2 text-[11px] text-[var(--color-text-muted)]">
          {t('assistantMessage.artifactReady')}
        </div>
      ) : null}

      {isLast && !isError ? (
        <div className="mt-2 -mb-1 flex items-center gap-1 flex-wrap">
          <button type="button" onClick={() => void regenerate()} className={ACTION_BTN}>
            <RefreshCcw className="w-3 h-3" />
            {t('assistantMessage.regenerate')}
          </button>
          {hasArtifact ? (
            <>
              <button type="button" onClick={() => void copyArtifact()} className={ACTION_BTN}>
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('common.copied') : t('assistantMessage.copyCode')}
              </button>
              <button type="button" onClick={snapshot} className={ACTION_BTN}>
                {snapped ? <Check className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                {snapped ? t('assistantMessage.snapshotSaved') : t('assistantMessage.saveSnapshot')}
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
