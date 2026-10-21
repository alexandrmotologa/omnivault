import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Star,
  Archive,
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
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Brain,
  MessageSquare,
  Send,
  Loader2,
} from 'lucide-react';
import { Article, ArticleStatus, Highlight, HighlightColor } from '../../lib/db/types';
import { UserPreferences } from '../../lib/storage/preferences';
import { HighlightMenu } from './HighlightMenu';
import { MarginNotesDrawer } from './MarginNotesDrawer';
import { ReaderSettingsModal } from './ReaderSettingsModal';
import { generateObsidianMarkdown } from '../../lib/export/obsidian';
import { downloadBlob } from '../../lib/export/backup';
import { TTSState } from '../../lib/tts/speech';
import { extractOfflineSummary } from '../../lib/ai/summarizer';
import { askArticleLLM, loadAISettings } from '../../lib/ai/llm';

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
}) => {
  const [scrollPercentage, setScrollPercentage] = useState(article.scroll_progress || 0);
  const [selectionMenuPos, setSelectionMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasCelebratedFinish, setHasCelebratedFinish] = useState(false);

  // Zen Mode state
  const [isZenMode, setIsZenMode] = useState(false);

  // Auto-scroll state (Teleprompter mode)
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(40); // px per second
  const autoScrollRef = useRef<number | null>(null);

  // Summarizer & AI Q&A State
  const [showTakeaways, setShowTakeaways] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract offline summary takeaways
  const summaryData = useMemo(() => {
    return extractOfflineSummary(article.content_markdown || article.content_html);
  }, [article.id, article.content_markdown, article.content_html]);

  // Filter highlights specifically for this article
  const articleHighlights = highlights.filter((h) => h.article_id === article.id);

  // Auto-scroll physics
  useEffect(() => {
    if (!isAutoScrolling) {
      if (autoScrollRef.current) cancelAnimationFrame(autoScrollRef.current);
      return;
    }

    let lastTime = performance.now();

    function step(now: number) {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (containerRef.current) {
        containerRef.current.scrollTop += autoScrollSpeed * delta;
        const maxScroll = containerRef.current.scrollHeight - containerRef.current.clientHeight;
        if (containerRef.current.scrollTop >= maxScroll - 5) {
          setIsAutoScrolling(false);
          return;
        }
      }

      autoScrollRef.current = requestAnimationFrame(step);
    }

    autoScrollRef.current = requestAnimationFrame(step);

    return () => {
      if (autoScrollRef.current) cancelAnimationFrame(autoScrollRef.current);
    };
  }, [isAutoScrolling, autoScrollSpeed]);

  // Keyboard shortcut listener: 'z' for Zen mode, 'Shift+Space' for auto-scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      } else if (e.code === 'Space' && e.shiftKey) {
        e.preventDefault();
        setIsAutoScrolling((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const handleExportSingleObsidian = () => {
    const md = generateObsidianMarkdown(article, articleHighlights);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const safeName = article.title.replace(/[\\/:*?"<>|]/g, '-').slice(0, 50);
    downloadBlob(blob, `${safeName}.md`);
  };

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

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    setIsAILoading(true);
    setAiAnswer(null);

    try {
      const settings = loadAISettings();
      const answer = await askArticleLLM(
        article.title,
        article.content_markdown || article.content_html,
        aiQuestion,
        settings
      );
      setAiAnswer(answer);
    } catch (err: any) {
      setAiAnswer(`Error: ${err.message}`);
    } finally {
      setIsAILoading(false);
    }
  };

  const renderFormattedHtml = () => {
    let html = article.content_html;

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
      className="relative flex-1 h-[calc(100vh-3.5rem)] overflow-y-auto bg-[var(--bg-primary)] flex flex-col items-center select-text"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-transparent z-40">
        <div
          className="h-full bg-blue-600 transition-all duration-75"
          style={{ width: `${Math.round(scrollPercentage * 100)}%` }}
        />
      </div>

      {/* Reader Action Header Bar (hidden in Zen mode) */}
      {!isZenMode && (
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
            {/* Auto-Scroll Toggle */}
            <button
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                isAutoScrolling
                  ? 'bg-amber-500 text-white font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
              }`}
              title="Hands-Free Auto Scroll (Shift+Space)"
            >
              {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Auto-Scroll</span>
            </button>

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

            {/* Zen Mode Toggle */}
            <button
              onClick={() => setIsZenMode(true)}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
              title="Zen Mode (Press 'z')"
            >
              <Maximize2 className="w-4 h-4" />
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
              <CheckCircle2 className="w-3.5 h-3.5" />
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
      )}

      {/* Floating Zen Mode exit pill */}
      {isZenMode && (
        <button
          onClick={() => setIsZenMode(false)}
          className="fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-card)]/80 backdrop-blur-md border border-[var(--border-color)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] shadow-lg transition-all opacity-40 hover:opacity-100"
          title="Exit Zen Mode (Esc or z)"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Exit Zen Mode</span>
        </button>
      )}

      {/* Floating Auto-scroll speed controller HUD */}
      {isAutoScrolling && (
        <div className="fixed bottom-6 right-6 z-40 p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl flex items-center gap-2 text-xs backdrop-blur-md animate-in fade-in duration-150">
          <button
            onClick={() => setIsAutoScrolling(false)}
            className="p-1 rounded bg-amber-500 text-white"
            title="Pause auto-scroll"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            {autoScrollSpeed} px/s
          </span>
          <input
            type="range"
            min="15"
            max="120"
            step="5"
            value={autoScrollSpeed}
            onChange={(e) => setAutoScrollSpeed(parseInt(e.target.value))}
            className="w-20 accent-amber-500 cursor-pointer"
          />
        </div>
      )}

      {/* Main Reading Container */}
      <main
        className="w-full px-4 sm:px-6 py-6 sm:py-10 transition-all flex flex-col justify-start"
        style={{
          maxWidth: `${preferences.maxWidth}px`,
        }}
      >
        {/* Article Meta Header */}
        <header className="space-y-4 mb-6 pb-6 border-b border-[var(--border-color)]">
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

        {/* Feature: Key Takeaways Card (Offline TextRank & Synthesis) */}
        <section className="mb-8 p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Executive Takeaways (Offline TextRank)
              </h4>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/15 text-blue-600 font-medium">
                {summaryData.difficulty}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowAIChat(!showAIChat)}
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 px-1.5 py-0.5"
              >
                <MessageSquare className="w-3 h-3" />
                <span>Ask AI</span>
              </button>
              <button
                onClick={() => setShowTakeaways(!showTakeaways)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {showTakeaways ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {showTakeaways && (
            <div className="space-y-2 pt-1 animate-in fade-in duration-150">
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                {summaryData.takeaways.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-blue-500 font-bold mt-0.5">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              {summaryData.keywords.length > 0 && (
                <div className="pt-2 border-t border-blue-500/20 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="text-[var(--text-muted)] font-medium">Core Concepts:</span>
                  {summaryData.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] font-mono"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Interactive AI Chat Grounded on Article Text */}
          {showAIChat && (
            <div className="pt-3 border-t border-blue-500/20 space-y-3">
              <form onSubmit={handleAskAI} className="flex gap-1.5">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="Ask a question about this research document..."
                  className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={isAILoading}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-1 shadow-xs disabled:opacity-50"
                >
                  {isAILoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Ask</span>
                </button>
              </form>

              {aiAnswer && (
                <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-500 font-semibold text-[11px]">
                    <Brain className="w-3.5 h-3.5" />
                    <span>Answer:</span>
                  </div>
                  <p className="whitespace-pre-wrap">{aiAnswer}</p>
                </div>
              )}
            </div>
          )}
        </section>

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
