import { ChatHistory } from './Sidebar/ChatHistory';
import { Composer } from './Sidebar/Composer';
import { ToolsPanel } from './Sidebar/ToolsPanel';

export { getTextareaLineHeight } from './Sidebar/Composer';

export interface SidebarProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onSubmit: () => void;
}

export function Sidebar({ prompt, setPrompt, onSubmit }: SidebarProps) {
  return (
    <aside className="flex flex-col min-h-0 border-r border-[var(--color-border)] bg-[var(--color-background-secondary)]">
      <ToolsPanel />
      <ChatHistory />
      <Composer prompt={prompt} setPrompt={setPrompt} onSubmit={onSubmit} />
    </aside>
  );
}
