import React, { useState } from 'react';
import {
  X,
  Highlighter,
  MessageSquare,
  Trash2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Highlight, HighlightColor } from '../../lib/db/types';

interface MarginNotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  highlights: Highlight[];
  articleTitle: string;
  onUpdateNote: (id: string, note: string) => void;
  onUpdateColor: (id: string, color: HighlightColor) => void;
  onDeleteHighlight: (id: string) => void;
  onJumpToHighlight?: (text: string) => void;
}

export const MarginNotesDrawer: React.FC<MarginNotesDrawerProps> = ({
  isOpen,
  onClose,
  highlights,
  articleTitle,
  onUpdateNote,
  onUpdateColor,
  onDeleteHighlight,
  onJumpToHighlight,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterColor, setFilterColor] = useState<HighlightColor | 'all'>('all');

  if (!isOpen) return null;

  const filteredHighlights = highlights.filter(
    (h) => filterColor === 'all' || h.color === filterColor
  );

  const colors: { id: HighlightColor; bg: string; border: string }[] = [
    { id: 'yellow', bg: 'bg-amber-300', border: 'border-amber-400' },
    { id: 'green', bg: 'bg-emerald-300', border: 'border-emerald-400' },
    { id: 'blue', bg: 'bg-blue-300', border: 'border-blue-400' },
    { id: 'purple', bg: 'bg-purple-300', border: 'border-purple-400' },
    { id: 'pink', bg: 'bg-rose-300', border: 'border-rose-400' },
  ];

  const handleStartEdit = (hl: Highlight) => {
    setEditingId(hl.id);
    setEditText(hl.note || '');
  };

  const handleSaveEdit = (id: string) => {
    onUpdateNote(id, editText);
    setEditingId(null);
  };

  const handleCopy = (hl: Highlight) => {
    let md = `> ${hl.text}`;
    if (hl.note) md += `\n>\n> **Note:** ${hl.note}`;
    navigator.clipboard.writeText(md);
    setCopiedId(hl.id);
    setTimeout(() => setCopiedId(null), 1000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-80 sm:w-96 bg-[var(--bg-card)] border-l border-[var(--border-color)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="px-4 py-3.5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
        <div className="flex items-center gap-2">
          <Highlighter className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Highlights & Notes ({highlights.length})
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter by color bar */}
      <div className="px-4 py-2 border-b border-[var(--border-color)] flex items-center justify-between text-xs bg-[var(--bg-card)]">
        <span className="text-[11px] text-[var(--text-muted)] font-medium">Filter Color:</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterColor('all')}
            className={`px-2 py-0.5 rounded text-[10px] ${
              filterColor === 'all'
                ? 'bg-blue-600 text-white font-medium'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            All
          </button>
          {colors.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterColor(c.id)}
              className={`w-3.5 h-3.5 rounded-full ${c.bg} ${
                filterColor === c.id ? 'ring-2 ring-blue-500 scale-110' : 'opacity-70 hover:opacity-100'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Highlights List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredHighlights.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)] space-y-2">
            <Highlighter className="w-8 h-8 mx-auto opacity-40" />
            <p className="text-xs">No highlights match the filter.</p>
            <p className="text-[11px]">Select text in the reader view to highlight.</p>
          </div>
        ) : (
          filteredHighlights.map((hl) => {
            const colorClass = `highlight-${hl.color}`;
            const isEditing = editingId === hl.id;

            return (
              <div
                key={hl.id}
                className="group relative p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 hover:border-blue-500/40 transition-colors space-y-2"
              >
                {/* Quote text */}
                <blockquote
                  onClick={() => onJumpToHighlight && onJumpToHighlight(hl.text)}
                  className={`text-xs text-[var(--text-primary)] cursor-pointer italic leading-relaxed border-l-2 pl-2 ${colorClass}`}
                  title="Click to jump in text"
                >
                  &ldquo;{hl.text}&rdquo;
                </blockquote>

                {/* Margin note */}
                {isEditing ? (
                  <div className="space-y-1.5 pt-1">
                    <textarea
                      rows={2}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full text-xs p-1.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="flex justify-end gap-1 text-[11px]">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-0.5 text-[var(--text-muted)]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(hl.id)}
                        className="px-2.5 py-0.5 rounded bg-blue-600 text-white font-medium"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : hl.note ? (
                  <div
                    onClick={() => handleStartEdit(hl)}
                    className="flex items-start gap-1.5 text-xs text-[var(--text-secondary)] bg-[var(--bg-card)] p-2 rounded border border-[var(--border-color)]/70 cursor-pointer hover:border-blue-400"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <span className="leading-snug">{hl.note}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartEdit(hl)}
                    className="text-[11px] text-[var(--text-muted)] hover:text-blue-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Add margin note</span>
                  </button>
                )}

                {/* Footer metadata & actions */}
                <div className="flex items-center justify-between pt-1 border-t border-[var(--border-color)]/40 text-[10px] text-[var(--text-muted)]">
                  <span>{new Date(hl.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                  <div className="flex items-center gap-1">
                    {/* Color picker */}
                    <div className="flex items-center gap-0.5 pr-1 border-r border-[var(--border-color)]">
                      {colors.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => onUpdateColor(hl.id, c.id)}
                          className={`w-2.5 h-2.5 rounded-full ${c.bg} ${
                            hl.color === c.id ? 'ring-1 ring-blue-500' : 'opacity-40 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => handleCopy(hl)}
                      className="p-1 rounded hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                      title="Copy Markdown Quote"
                    >
                      {copiedId === hl.id ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>

                    <button
                      onClick={() => onDeleteHighlight(hl.id)}
                      className="p-1 rounded hover:text-red-500 hover:bg-[var(--bg-secondary)]"
                      title="Delete Highlight"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Drawer Footer: Export all notes */}
      {highlights.length > 0 && (
        <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/30">
          <button
            onClick={() => {
              let md = `# Highlights: ${articleTitle}\n\n`;
              for (const h of highlights) {
                md += `> ${h.text}\n\n`;
                if (h.note) md += `*Note:* ${h.note}\n\n`;
              }
              navigator.clipboard.writeText(md);
              alert('Copied all article highlights and notes to clipboard as Markdown!');
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy All Notes as Markdown</span>
          </button>
        </div>
      )}
    </div>
  );
};
