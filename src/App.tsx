import React, { useState, useEffect, useCallback } from 'react';
import { vault } from './lib/db/sqlite';
import { Article, ArticleStatus, Highlight, RssFeed, SearchResult, VaultStats } from './lib/db/types';
import { loadPreferences, savePreferences, UserPreferences, ReaderTheme } from './lib/storage/preferences';
import { ttsEngine, TTSState } from './lib/tts/speech';

import { AppHeader } from './components/layout/AppHeader';
import { AppSidebar } from './components/layout/AppSidebar';
import { ArticleList } from './components/vault/ArticleList';
import { ArticleReader } from './components/reader/ArticleReader';
import { TTSPlayerBar } from './components/reader/TTSPlayerBar';
import { ClipArticleModal } from './components/clipper/ClipArticleModal';
import { BookmarkletModal } from './components/clipper/BookmarkletModal';
import { FeedManagerModal } from './components/feeds/FeedManagerModal';
import { ExportSyncModal } from './components/export/ExportSyncModal';
import { AnalyticsDashboard } from './components/stats/AnalyticsDashboard';
import { ReaderSettingsModal } from './components/reader/ReaderSettingsModal';
import { ShortcutsCheatSheet } from './components/common/ShortcutsCheatSheet';

export function App() {
  // Database & Content State
  const [articles, setArticles] = useState<Article[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  // Navigation & Filter State
  const [currentStatus, setCurrentStatus] = useState<ArticleStatus | 'favorites' | 'highlights'>('inbox');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);

  // User Preferences & Themes
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences);

  // Modals state
  const [isClipModalOpen, setIsClipModalOpen] = useState(false);
  const [isBookmarkletOpen, setIsBookmarkletOpen] = useState(false);
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // TTS State
  const [ttsState, setTTSState] = useState<TTSState>(ttsEngine.getState());
  const [activeTTSChunk, setActiveTTSChunk] = useState<string>('');
  const [showTTSDock, setShowTTSDock] = useState(false);

  // Reload vault data
  const loadVaultData = useCallback(async () => {
    try {
      const allArticles = await vault.getArticles();
      const allHighlights = await vault.getHighlights();
      const allFeeds = await vault.getFeeds();
      const vaultStats = await vault.getStats();

      setArticles(allArticles);
      setHighlights(allHighlights);
      setFeeds(allFeeds);
      setStats(vaultStats);
    } catch (err) {
      console.error('Error loading vault data:', err);
    }
  }, []);

  // Initial setup
  useEffect(() => {
    // Apply initial theme
    document.body.setAttribute('data-theme', preferences.theme);

    // Subscribe to TTS
    const unsubscribeTTS = ttsEngine.subscribe((state, chunk) => {
      setTTSState(state);
      setActiveTTSChunk(chunk);
      if (state.isPlaying || state.isPaused) {
        setShowTTSDock(true);
      }
    });

    // Initialize SQLite & load data
    loadVaultData().then(() => {
      // Check if URL has bookmarklet clip query
      const params = new URLSearchParams(window.location.search);
      const clipUrl = params.get('clip_url');
      if (clipUrl) {
        setIsClipModalOpen(true);
      }
    });

    return () => {
      unsubscribeTTS();
    };
  }, [loadVaultData, preferences.theme]);

  // Handle Search using SQLite FTS5
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await vault.searchArticles(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('FTS5 Search error:', err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update preferences
  const handleUpdatePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  // Keyboard Shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('fts-search-input');
        searchInput?.focus();
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(true);
      } else if (e.key === 'Escape') {
        if (activeArticle) {
          setActiveArticle(null);
        } else {
          setSearchQuery('');
        }
      } else if (e.key === 't' || e.key === 'T') {
        if (activeArticle) {
          e.preventDefault();
          if (ttsState.isPlaying) {
            ttsEngine.pause();
          } else {
            handleStartTTS(activeArticle);
          }
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (activeArticle) {
          e.preventDefault();
          handleToggleFavorite(activeArticle.id);
        }
      } else if (e.key === 'e' || e.key === 'a' || e.key === 'E' || e.key === 'A') {
        if (activeArticle) {
          e.preventDefault();
          const nextStatus = activeArticle.status === 'archived' ? 'inbox' : 'archived';
          handleUpdateStatus(activeArticle.id, nextStatus);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeArticle, ttsState.isPlaying]);

  // Article Actions
  const handleToggleFavorite = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    await vault.toggleFavorite(id);
    await loadVaultData();
    if (activeArticle && activeArticle.id === id) {
      const updated = await vault.getArticleById(id);
      setActiveArticle(updated);
    }
  };

  const handleUpdateStatus = async (id: string, status: ArticleStatus, e?: React.MouseEvent) => {
    e?.stopPropagation();
    await vault.updateArticleStatus(id, status);
    await loadVaultData();
    if (activeArticle && activeArticle.id === id) {
      const updated = await vault.getArticleById(id);
      setActiveArticle(updated);
    }
  };

  const handleDeleteArticle = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const article = articles.find((a) => a.id === id);
    const permanent = article?.status === 'trash';
    await vault.deleteArticle(id, permanent);
    await loadVaultData();
    if (activeArticle && activeArticle.id === id) {
      setActiveArticle(null);
    }
  };

  const handleSaveArticle = async (article: Article) => {
    await vault.saveArticle(article);
    await loadVaultData();
    setActiveArticle(article);
  };

  const handleSaveHighlight = async (hl: Highlight) => {
    await vault.saveHighlight(hl);
    await loadVaultData();
  };

  const handleDeleteHighlight = async (id: string) => {
    await vault.deleteHighlight(id);
    await loadVaultData();
  };

  const handleUpdateScrollProgress = async (id: string, progress: number) => {
    await vault.updateScrollProgress(id, progress);
  };

  // Start TTS for an article
  const handleStartTTS = (art: Article) => {
    ttsEngine.prepareArticle(art.title, art.content_html || art.content_markdown);
    ttsEngine.play();
    setShowTTSDock(true);
  };

  // Feeds actions
  const handleSaveFeed = async (feed: RssFeed) => {
    await vault.saveFeed(feed);
    await loadVaultData();
  };

  const handleDeleteFeed = async (id: string) => {
    await vault.deleteFeed(id);
    await loadVaultData();
  };

  // Filter articles based on sidebar selection
  const filteredArticles = articles.filter((a) => {
    if (selectedTag) {
      return a.tags.includes(selectedTag);
    }
    if (currentStatus === 'favorites') return a.favorite === 1;
    if (currentStatus === 'highlights') {
      const hasHl = highlights.some((h) => h.article_id === a.id);
      return hasHl;
    }
    return a.status === currentStatus;
  });

  // Calculate status counts for sidebar
  const counts = {
    inbox: articles.filter((a) => a.status === 'inbox').length,
    reading: articles.filter((a) => a.status === 'reading').length,
    favorites: articles.filter((a) => a.favorite === 1).length,
    archived: articles.filter((a) => a.status === 'archived').length,
    trash: articles.filter((a) => a.status === 'trash').length,
    highlights: highlights.length,
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Top Application Header */}
      <AppHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenClipModal={() => setIsClipModalOpen(true)}
        onOpenFeedModal={() => setIsFeedModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenStatsModal={() => setIsStatsModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        currentTheme={preferences.theme}
        onThemeChange={(th: ReaderTheme) => handleUpdatePreferences({ ...preferences, theme: th })}
      />

      {/* Main Workspace: Either Article Reader or Vault Explorer */}
      {activeArticle ? (
        <ArticleReader
          article={activeArticle}
          highlights={highlights}
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
          onBack={() => setActiveArticle(null)}
          onToggleFavorite={handleToggleFavorite}
          onUpdateStatus={handleUpdateStatus}
          onDeleteArticle={handleDeleteArticle}
          onSaveHighlight={handleSaveHighlight}
          onDeleteHighlight={handleDeleteHighlight}
          onUpdateScrollProgress={handleUpdateScrollProgress}
          onStartTTS={handleStartTTS}
          ttsState={ttsState}
          activeTTSChunk={activeTTSChunk}
        />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation Sidebar */}
          <AppSidebar
            currentStatus={currentStatus}
            onSelectStatus={setCurrentStatus}
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
            tags={stats?.tagCounts || []}
            counts={counts}
            onOpenBookmarklet={() => setIsBookmarkletOpen(true)}
          />

          {/* Center Articles View */}
          <ArticleList
            articles={filteredArticles}
            searchResults={searchResults}
            searchQuery={searchQuery}
            highlights={highlights}
            currentStatus={currentStatus}
            selectedTag={selectedTag}
            onOpenArticle={(art) => setActiveArticle(art)}
            onToggleFavorite={handleToggleFavorite}
            onUpdateStatus={handleUpdateStatus}
            onDeleteArticle={handleDeleteArticle}
            onOpenClipModal={() => setIsClipModalOpen(true)}
            onClearSearch={() => setSearchQuery('')}
          />
        </div>
      )}

      {/* Persistent Floating Text-to-Speech Dock */}
      {showTTSDock && (
        <TTSPlayerBar
          ttsState={ttsState}
          activeText={activeTTSChunk}
          articleTitle={activeArticle?.title || 'Omnivault Audio Player'}
          onPlay={() => ttsEngine.play()}
          onPause={() => ttsEngine.pause()}
          onStop={() => ttsEngine.stop()}
          onNext={() => ttsEngine.nextChunk()}
          onPrev={() => ttsEngine.prevChunk()}
          onSetRate={(r) => ttsEngine.setRate(r)}
          onSetVoice={(v) => ttsEngine.setVoice(v)}
          onClose={() => setShowTTSDock(false)}
        />
      )}

      {/* Modals */}
      <ClipArticleModal
        isOpen={isClipModalOpen}
        onClose={() => setIsClipModalOpen(false)}
        onSaveArticle={handleSaveArticle}
      />

      <BookmarkletModal
        isOpen={isBookmarkletOpen}
        onClose={() => setIsBookmarkletOpen(false)}
      />

      <FeedManagerModal
        isOpen={isFeedModalOpen}
        onClose={() => setIsFeedModalOpen(false)}
        feeds={feeds}
        onSaveFeed={handleSaveFeed}
        onDeleteFeed={handleDeleteFeed}
        onSaveArticle={handleSaveArticle}
      />

      <ExportSyncModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        articles={articles}
        highlights={highlights}
        onReloadVault={loadVaultData}
      />

      <AnalyticsDashboard
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        stats={stats}
      />

      <ReaderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
      />

      <ShortcutsCheatSheet
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
export default App;
