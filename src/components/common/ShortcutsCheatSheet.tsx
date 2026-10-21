import React from 'react';
import { Modal } from './Modal';
import { Command } from 'lucide-react';

interface ShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsCheatSheet: React.FC<ShortcutsProps> = ({ isOpen, onClose }) => {
  const shortcuts = [
    { key: '/', description: 'Instant SQLite FTS5 search' },
    { key: 'j / k', description: 'Next / previous article or scroll' },
    { key: 'h', description: 'Highlight selected text in reader' },
    { key: 'e or a', description: 'Archive active article' },
    { key: 's', description: 'Toggle favorite star' },
    { key: 't', description: 'Play / Pause text-to-speech podcast' },
    { key: 'd', description: 'Move article to trash' },
    { key: 'Esc', description: 'Close modals, drawers, or exit reader' },
    { key: '?', description: 'Show keyboard shortcuts cheat sheet' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" maxWidth="max-w-md">
      <div className="space-y-4">
        <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
          <Command className="w-3.5 h-3.5" />
          Navigate Omnivault efficiently using Vim and Readwise key bindings.
        </p>

        <div className="divide-y divide-[var(--border-color)] border border-[var(--border-color)] rounded-lg overflow-hidden">
          {shortcuts.map((sc, idx) => (
            <div key={idx} className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--bg-card)]">
              <span className="text-xs text-[var(--text-secondary)]">{sc.description}</span>
              <kbd className="px-2 py-0.5 text-xs font-mono font-semibold bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] shadow-xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
