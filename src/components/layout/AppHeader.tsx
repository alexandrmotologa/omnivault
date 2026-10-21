import React from 'react';
import {
  Search,
  Plus,
  Rss,
  Share2,
  BarChart3,
  HelpCircle,
  Sliders,
  Database,
  Bookmark,
  Brain,
  Network,
} from 'lucide-react';
import { ReaderTheme } from '../../lib/storage/preferences';

interface AppHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenClipModal: () => void;
  onOpenFeedModal: () => void;
  onOpenExportModal: () => void;
  onOpenStatsModal: () => void;
  onOpenShortcuts: () => void;
  onOpenSettings: () => void;
  onOpenReviewModal: () => void;
  onOpenGraphModal: () => void;
  dueReviewsCount: number;
  currentTheme: ReaderTheme;
  onThemeChange: (t: ReaderTheme) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenClipModal,
  onOpenFeedModal,
  onOpenExportModal,
  onOpenStatsModal,
  onOpenShortcuts,
  onOpenSettings,
  onOpenReviewModal,
  onOpenGraphModal,
  dueReviewsCount,
  currentTheme,
  onThemeChange,
}) => {
  const themes: { id: ReaderTheme; label: string; iconColor: string }[] = [
    { id: 'paper', label: 'Paper', iconColor: 'bg-[#faf9f5] border border-amber-200' },
    { id: 'sepia', label: 'Sepia', iconColor: 'bg-[#f6eedb] border border-amber-300' },
    { id: 'charcoal', label: 'Dark', iconColor: 'bg-[#18191c] border border-zinc-700' },
    { id: 'nord', label: 'Nord', iconColor: 'bg-[#2e3440] border border-cyan-800' },
    { id: 'oled', label: 'OLED', iconColor: 'bg-black border border-zinc-800' },
  ];

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/90 backdrop-blur-md px-4 flex items-center justify-between gap-4">
      {/* Brand logo & tagline */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
          <Bookmark className="w-4 h-4 fill-current stroke-blue-600" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-base tracking-tight text-[var(--text-primary)]">
            omnivault
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
            <Database className="w-2.5 h-2.5" />
            SQLite FTS5
          </span>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-lg relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search articles with SQLite FTS5 (press '/' to focus)..."
            id="fts-search-input"
            className="w-full pl-9 pr-12 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-8 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] px-1"
            >
              ×
            </button>
          )}
          <kbd className="hidden md:inline-block absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded">
            /
          </kbd>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenClipModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-xs"
          title="Save URL, Paste HTML, or Drop File"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">Clip Webpage</span>
        </button>

        {/* Daily Review Flashcards Button with counter badge */}
        <button
          onClick={onOpenReviewModal}
          className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 text-xs font-medium transition-colors"
          title="Daily Review & Spaced Repetition Flashcards"
        >
          <Brain className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Daily Review</span>
          {dueReviewsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-600 text-white font-bold">
              {dueReviewsCount}
            </span>
          )}
        </button>

        {/* Knowledge Graph Button */}
        <button
          onClick={onOpenGraphModal}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          title="Interactive Knowledge Graph View"
        >
          <Network className="w-4 h-4 text-emerald-500" />
        </button>

        <button
          onClick={onOpenFeedModal}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          title="RSS & Atom Feeds"
        >
          <Rss className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenExportModal}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          title="Obsidian, Logseq & Vault Sync"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenStatsModal}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          title="Reading Analytics & Streaks"
        >
          <BarChart3 className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          title="Reading Appearance & Typography"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Quick Theme Switcher */}
        <div className="hidden lg:flex items-center gap-1 pl-2 border-l border-[var(--border-color)]">
          {themes.map((th) => (
            <button
              key={th.id}
              onClick={() => onThemeChange(th.id)}
              title={`Switch to ${th.label} theme`}
              className={`w-4 h-4 rounded-full ${th.iconColor} transition-transform ${
                currentTheme === th.id ? 'ring-2 ring-blue-500 scale-110' : 'opacity-70 hover:opacity-100'
              }`}
            />
          ))}
        </div>

        <button
          onClick={onOpenShortcuts}
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          title="Keyboard Shortcuts (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
