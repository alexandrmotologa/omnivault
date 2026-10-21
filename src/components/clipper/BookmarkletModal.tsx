import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Bookmark, Copy, Check, MousePointerClick } from 'lucide-react';
import { generateBookmarkletCode } from '../../lib/clipper/fetcher';

interface BookmarkletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookmarkletModal: React.FC<BookmarkletModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const bookmarkletCode = generateBookmarkletCode();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="1-Click Browser Bookmarklet" maxWidth="max-w-md">
      <div className="space-y-5 text-xs">
        <div className="space-y-1">
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Clip any article from anywhere on the web directly into Omnivault with zero extensions required.
          </p>
        </div>

        {/* Draggable button card */}
        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 text-center space-y-3">
          <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1.5">
            <MousePointerClick className="w-3.5 h-3.5" />
            Drag this button to your browser&apos;s Bookmarks Bar:
          </p>

          <a
            href={bookmarkletCode}
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md cursor-grab active:cursor-grabbing text-xs select-none"
            title="Drag me to your Bookmarks Bar"
          >
            <Bookmark className="w-4 h-4 fill-current stroke-blue-600" />
            <span>Clip to Omnivault</span>
          </a>
        </div>

        {/* Instructions */}
        <div className="space-y-2 text-[var(--text-secondary)]">
          <h5 className="font-semibold text-[var(--text-primary)]">How to use:</h5>
          <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed text-[11px]">
            <li>Show your browser bookmarks bar (<kbd className="font-mono bg-[var(--bg-secondary)] px-1 rounded">Cmd+Shift+B</kbd> or <kbd className="font-mono bg-[var(--bg-secondary)] px-1 rounded">Ctrl+Shift+B</kbd>).</li>
            <li>Drag the blue <strong>Clip to Omnivault</strong> button above into your bookmarks bar.</li>
            <li>Whenever you read an interesting article on the web, click the bookmark to send it to your offline vault.</li>
          </ol>
        </div>

        {/* Manual Copy Code */}
        <div className="pt-2 border-t border-[var(--border-color)] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-[var(--text-muted)]">
            <span>Or copy JavaScript snippet:</span>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 text-blue-600 hover:underline"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[10px] font-mono text-[var(--text-muted)] overflow-x-auto whitespace-pre-wrap break-all max-h-24">
            {bookmarkletCode}
          </pre>
        </div>
      </div>
    </Modal>
  );
};
