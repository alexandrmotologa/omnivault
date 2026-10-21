import React, { useState } from 'react';
import { MessageSquare, Copy, Check } from 'lucide-react';
import { HighlightColor } from '../../lib/db/types';

interface HighlightMenuProps {
  position: { x: number; y: number } | null;
  onSelectColor: (color: HighlightColor, note?: string) => void;
  onClose: () => void;
  selectedText: string;
}

export const HighlightMenu: React.FC<HighlightMenuProps> = ({
  position,
  onSelectColor,
  onClose,
  selectedText,
}) => {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [selectedColor, setSelectedColor] = useState<HighlightColor>('yellow');
  const [copied, setCopied] = useState(false);

  if (!position) return null;

  const colors: { id: HighlightColor; bg: string; border: string; label: string }[] = [
    { id: 'yellow', bg: 'bg-amber-300', border: 'border-amber-400', label: 'Yellow' },
    { id: 'green', bg: 'bg-emerald-300', border: 'border-emerald-400', label: 'Green' },
    { id: 'blue', bg: 'bg-blue-300', border: 'border-blue-400', label: 'Blue' },
    { id: 'purple', bg: 'bg-purple-300', border: 'border-purple-400', label: 'Purple' },
    { id: 'pink', bg: 'bg-rose-300', border: 'border-rose-400', label: 'Pink' },
  ];

  const handleCopyQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`> ${selectedText}`);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 800);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    onSelectColor(selectedColor, noteText.trim());
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: `${Math.max(10, Math.min(window.innerWidth - 300, position.x - 120))}px`,
        top: `${Math.max(10, position.y - 50)}px`,
      }}
      className="z-50 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl p-1.5 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md"
      onClick={(e) => e.stopPropagation()}
    >
      {!showNoteInput ? (
        <div className="flex items-center gap-1">
          {colors.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectColor(c.id)}
              className={`w-6 h-6 rounded-full ${c.bg} border ${c.border} hover:scale-115 active:scale-95 transition-transform`}
              title={`Highlight in ${c.label}`}
            />
          ))}

          <div className="w-[1px] h-4 bg-[var(--border-color)] mx-1" />

          <button
            onClick={() => setShowNoteInput(true)}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-blue-500 hover:bg-[var(--bg-secondary)] transition-colors"
            title="Add Margin Note"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={handleCopyQuote}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            title="Copy as Markdown Quote"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <form onSubmit={handleAddNote} className="p-1 space-y-2 w-64">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--text-muted)]">Margin Note</span>
            <div className="flex items-center gap-1">
              {colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(c.id)}
                  className={`w-4 h-4 rounded-full ${c.bg} ${
                    selectedColor === c.id ? 'ring-2 ring-blue-500' : 'opacity-60'
                  }`}
                />
              ))}
            </div>
          </div>
          <textarea
            autoFocus
            rows={2}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Write your research thought or annotation..."
            className="w-full text-xs p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex justify-end gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setShowNoteInput(false)}
              className="px-2 py-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded bg-blue-600 text-white font-medium hover:bg-blue-700"
            >
              Save Note
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
