import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Star,
  Archive,
  Inbox,
  Volume2,
  Highlighter,
  Sliders,
  ExternalLink,
  Share2,
  Trash2,
  CheckCircle2,
  Clock,
  Globe,
  Tag as TagIcon,
} from 'lucide-react';
import { Article, ArticleStatus, Highlight, HighlightColor } from '../../lib/db/types';
import { UserPreferences } from '../../lib/storage/preferences';
import { HighlightMenu } from './HighlightMenu';
import { MarginNotesDrawer } from './MarginNotesDrawer';
import { ReaderSettingsModal } from './ReaderSettingsModal';
import { generateObsidianMarkdown } from '../../lib/export/obsidian';
import { downloadBlob } from '../../lib/export/backup';
import { TTSState } from '../../lib/tts/speech';

interface ArticleReaderProps {
  article: Article;
  highlights: Highlight[];
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: UserPreferences) => void;
  onBack: () => void;
  onToggleFavorite: (id: string) => void;
  onUpdateStatus: (id: string, status: ArticleStatus) => void;
  onDeleteArticle: (id: string) => void;
  onSaveHighlight: (hl: Highlight) => void;
  onDeleteHighlight: (id: string) => void;
  onUpdateScrollProgress: (id: string, progress: number) => void;
  onStartTTS: (article: Article) => void;
  ttsState: TTSState;
  activeTTSChunk: string;
}

export const ArticleReader: React.FC<ArticleReaderProps> = ({
  article,
  highlights,
  preferences,
  onUpdatePreferences,
  onBack,
  onToggleFavorite,
  onUpdateStatus,
  onDeleteArticle,
  onSaveHighlight,
  onDeleteHighlight,
  onUpdateScrollProgress,
  onStartTTS,
  ttsState,
  activeTTSChunk,
}) => {
  const [scrollPercentage, setScrollPercentage] = useState(article.scroll_progress || 0);
  const [selectionMenuPos, setSelectionMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasCelebratedFinish, setHasCelebratedFinish] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter highlights specifically for this article
  const articleHighlights = highlights.filter((h) => h.article_id === article.id);

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const total = el.scrollHeight - el.clientHeight;
      if (total <= 0) return;
      const current = Math.min(1, Math.max(0, el.scrollTop / total));
      setScrollPercentage(current);
      onUpdateScrollProgress(article.id, current);

      // Finish celebration when scrolled to end
      if (current > 0.95 && !hasCelebratedFinish && article.status !== 'archived') {
        setHasCelebratedFinish(true);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      // Restore previous scroll position if stored
      if (article.scroll_progress > 0.05 && article.scroll_progress < 0.95) {
        const targetScroll = (container.scrollHeight - container.clientHeight) * article.scroll_progress;
        container.scrollTop = targetScroll;
      }
    }

    return () => {
      container?.removeEventListener('scroll', handleScroll);
    };
  }, [article.id]);

  // Selection detection for highlighter
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectionMenuPos(null);
        setSelectedText('');
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 2) {
        setSelectionMenuPos(null);
        setSelectedText('');
        return;
      }

      // Check if selection is inside reader content
      if (contentRef.current && contentRef.current.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionMenuPos({
          x: rect.left + rect.width / 2,
          y: rect.top,
        });
        setSelectedText(text);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Handle creating a new highlight
  const handleCreateHighlight = (color: HighlightColor, note?: string) => {
    if (!selectedText) return;

    const newHl: Highlight = {
      id: 'hl-' + Math.random().toString(36).substring(2, 9),
      article_id: article.id,
      text: selectedText,
      note: note || '',
      color,
      prefix: '',
      suffix: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSaveHighlight(newHl);
    setSelectionMenuPos(null);
    window.getSelection()?.removeAllRanges();
    if (note) {
      setIsNotesDrawerOpen(true);
    }
  };

  // Export single article to Obsidian Markdown
  const handleExportSingleObsidian = () => {
    const md = generateObsidianMarkdown(article, articleHighlights);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const safeName = article.title.replace(/[\\/:*?"<>|]/g, '-').slice(0, 50);
    downloadBlob(blob, `${safeName}.md`);
  };

  // Jump to highlight in content
  const handleJumpToHighlight = (text: string) => {
    if (!contentRef.current) return;
    const elements = contentRef.current.querySelectorAll('p, li, blockquote');
    for (const el of Array.from(elements)) {
      if (el.textContent?.includes(text)) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('tts-speaking-current');
        setTimeout(() => el.classList.remove('tts-speaking-current'), 1500);
        break;
      }
    }
  };

  // Format bionic text if enabled
  const renderFormattedHtml = () => {
    let html = article.content_html;

    // Apply highlights as spans
    for (const hl of articleHighlights) {
      const escaped = hl.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      html = html.replace(
        regex,
        `<mark class="highlight-${hl.color} cursor-pointer" data-hl-id="${hl.id}" title="${
          hl.note ? 'Note: ' + hl.note.replace(/"/g, '&quot;') : 'Highlight'
        }">$1</mark>`
      );
    }

    return html;
  };

  const fontClass =
    preferences.font === 'serif'
      ? 'font-serif-reader'
      : preferences.font === 'mono'
      ? 'font-mono-reader'
      : 'font-sans-reader';

  const isArchived = article.status === 'archived';

  return (
    <div
      ref={containerRef}
      className="relative flex-1 h-[calc(100vh-3.5rem)] overflow-y-auto bg-[var(--bg-primary)] flex flex-col items-center"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Top Reading Progress Bar */}
      <div className="fixed top-14 left-0 right-0 h-1 bg-transparent z-30">
        <div
          className="h-full bg-blue-600 transition-all duration-75"
          style={{ width: `${Math.round(scrollPercentage * 100)}%` }}
        />
      </div>

      {/* Reader Action Header Bar */}
      <div className="sticky top-0 z-20 w-full border-b border-[var(--border-color)] bg-[var(--bg-primary)]/90 backdrop-blur-md px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Vault</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* TTS Listen Button */}
          <button
            onClick={() => onStartTTS(article)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              ttsState.isPlaying
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
            }`}
            title="Listen to Article with On-Device TTS"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {ttsState.isPlaying ? 'Listening...' : 'Listen'}
            </span>
          </button>

          {/* Highlights Drawer Toggle */}
          <button
            onClick={() => setIsNotesDrawerOpen(!isNotesDrawerOpen)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            title="View Highlights & Margin Notes"
          >
            <Highlighter className="w-3.5 h-3.5 text-amber-500" />
            <span>{articleHighlights.length}</span>
          </button>

          {/* Typography Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            title="Typography & Appearance"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Star Favorite */}
          <button
            onClick={() => onToggleFavorite(article.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              article.favorite
                ? 'text-amber-500 fill-amber-500'
                : 'text-[var(--text-secondary)] hover:text-amber-500 hover:bg-[var(--bg-secondary)]'
            }`}
            title="Toggle Favorite"
          >
            <Star className={`w-4 h-4 ${article.favorite ? 'fill-current' : ''}`} />
          </button>

          {/* Archive / Inbox */}
          <button
            onClick={() => onUpdateStatus(article.id, isArchived ? 'inbox' : 'archived')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
              isArchived
                ? 'text-emerald-600 bg-emerald-500/10'
                : 'text-[var(--text-secondary)] hover:text-blue-500 hover:bg-[var(--bg-secondary)]'
            }`}
            title={isArchived ? 'Return to Inbox' : 'Mark as Archived'}
          >
            {isArchived ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isArchived ? 'Archived' : 'Archive'}</span>
          </button>

          {/* Export to Obsidian */}
          <button
            onClick={handleExportSingleObsidian}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            title="Export Markdown to Obsidian"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Trash */}
          <button
            onClick={() => {
              if (confirm('Move this article to trash?')) {
                onDeleteArticle(article.id);
                onBack();
              }
            }}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--bg-secondary)] transition-colors"
            title="Delete Article"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Reading Container */}
      <main
        className="w-full px-6 py-12 transition-all flex flex-col justify-start"
        style={{
          maxWidth: `${preferences.maxWidth}px`,
        }}
      >
        {/* Article Meta Header */}
        <header className="space-y-4 mb-8 pb-6 border-b border-[var(--border-color)]">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
              <Globe className="w-3 h-3" />
              {article.site_name || 'Web Article'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.reading_time_minutes} min read ({article.word_count} words)
            </span>
            <span>•</span>
            <span>{new Date(article.saved_at).toLocaleDateString()}</span>
          </div>

          <h1
            className="font-bold tracking-tight text-[var(--text-primary)] leading-tight"
            style={{ fontSize: `${Math.round(preferences.fontSize * 1.85)}px` }}
          >
            {article.title}
          </h1>

          {article.byline && (
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              By {article.byline}
            </p>
          )}

          {article.url && (
            <div className="pt-1">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-blue-500 transition-colors"
              >
                <span>Original source</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-mono"
                >
                  <TagIcon className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Clean Article Content */}
        <article
          ref={contentRef}
          className={`reader-content ${fontClass} leading-relaxed text-[var(--text-primary)] selection:bg-amber-200 selection:text-stone-900`}
          style={{
            fontSize: `${preferences.fontSize}px`,
            lineHeight: preferences.lineHeight,
          }}
          dangerouslySetInnerHTML={{ __html: renderFormattedHtml() }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'MARK' && target.dataset.hlId) {
              setIsNotesDrawerOpen(true);
            }
          }}
        />

        {/* Reading Completion Banner */}
        <div className="mt-16 p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/40 text-center space-y-3">
          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
          <h4 className="text-base font-semibold text-[var(--text-primary)]">
            You reached the end of this article!
          </h4>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            {articleHighlights.length > 0
              ? `You made ${articleHighlights.length} annotations in this article.`
              : 'Add margin notes or archive to keep your reading inbox clean.'}
          </p>
          <div className="flex justify-center gap-2 pt-2">
            {!isArchived ? (
              <button
                onClick={() => onUpdateStatus(article.id, 'archived')}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Archive to Vault
              </button>
            ) : (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Archived in your Research Vault
              </span>
            )}
            <button
              onClick={handleExportSingleObsidian}
              className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs font-medium hover:bg-[var(--border-color)] text-[var(--text-primary)] transition-colors"
            >
              Export to Obsidian
            </button>
          </div>
        </div>
      </main>

      {/* Floating Highlight Menu Popover */}
      <HighlightMenu
        position={selectionMenuPos}
        onSelectColor={handleCreateHighlight}
        onClose={() => setSelectionMenuPos(null)}
        selectedText={selectedText}
      />

      {/* Margin Notes Slide-over Drawer */}
      <MarginNotesDrawer
        isOpen={isNotesDrawerOpen}
        onClose={() => setIsNotesDrawerOpen(false)}
        highlights={articleHighlights}
        articleTitle={article.title}
        onUpdateNote={(id, note) => {
          const hl = highlights.find((h) => h.id === id);
          if (hl) onSaveHighlight({ ...hl, note, updated_at: new Date().toISOString() });
        }}
        onUpdateColor={(id, color) => {
          const hl = highlights.find((h) => h.id === id);
          if (hl) onSaveHighlight({ ...hl, color, updated_at: new Date().toISOString() });
        }}
        onDeleteHighlight={onDeleteHighlight}
        onJumpToHighlight={handleJumpToHighlight}
      />

      {/* Reader Settings Modal */}
      <ReaderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onUpdatePreferences={onUpdatePreferences}
      />
    </div>
  );
};
