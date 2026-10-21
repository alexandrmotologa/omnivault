import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import {
  Rss,
  Plus,
  Trash2,
  ExternalLink,
  BookDown,
  Loader2,
  FileCode,
  Check,
  RefreshCw,
} from 'lucide-react';
import { RssFeed, Article } from '../../lib/db/types';
import { fetchAndParseFeed, parseOpml, ParsedFeed } from '../../lib/feeds/rss';
import { extractArticleFromHtml } from '../../lib/clipper/extract';

interface FeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeds: RssFeed[];
  onSaveFeed: (feed: RssFeed) => Promise<void>;
  onDeleteFeed: (id: string) => Promise<void>;
  onSaveArticle: (article: Article) => Promise<void>;
}

export const FeedManagerModal: React.FC<FeedModalProps> = ({
  isOpen,
  onClose,
  feeds,
  onSaveFeed,
  onDeleteFeed,
  onSaveArticle,
}) => {
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [selectedFeed, setSelectedFeed] = useState<RssFeed | null>(null);
  const [feedData, setFeedData] = useState<ParsedFeed | null>(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [isAddingFeed, setIsAddingFeed] = useState(false);
  const [savedArticleLinks, setSavedArticleLinks] = useState<Set<string>>(new Set());
  const [statusMessage, setStatusMessage] = useState('');

  // Auto load first feed on open
  useEffect(() => {
    if (isOpen && feeds.length > 0 && !selectedFeed) {
      loadFeedArticles(feeds[0]);
    }
  }, [isOpen, feeds]);

  const loadFeedArticles = async (feed: RssFeed) => {
    setSelectedFeed(feed);
    setIsLoadingFeed(true);
    setStatusMessage('');
    try {
      const data = await fetchAndParseFeed(feed.url);
      setFeedData(data);
    } catch (err: any) {
      setStatusMessage(`Failed loading feed: ${err.message}`);
      setFeedData(null);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedUrl.trim()) return;

    setIsAddingFeed(true);
    setStatusMessage('');
    try {
      const data = await fetchAndParseFeed(newFeedUrl.trim());
      const newFeed: RssFeed = {
        id: 'feed-' + Math.random().toString(36).substring(2, 9),
        title: data.title || 'Untitled Feed',
        url: newFeedUrl.trim(),
        site_url: data.link || '',
        icon_url: '',
        last_fetched_at: new Date().toISOString(),
        unread_count: data.items.length,
      };

      await onSaveFeed(newFeed);
      setNewFeedUrl('');
      loadFeedArticles(newFeed);
    } catch (err: any) {
      setStatusMessage(`Error subscribing: ${err.message}`);
    } finally {
      setIsAddingFeed(false);
    }
  };

  const handleImportOpml = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      const text = await file.text();
      const opmlFeeds = parseOpml(text);
      let count = 0;
      for (const f of opmlFeeds) {
        const feed: RssFeed = {
          id: 'feed-' + Math.random().toString(36).substring(2, 9),
          title: f.title,
          url: f.xmlUrl,
          site_url: f.htmlUrl,
          icon_url: '',
          last_fetched_at: null,
          unread_count: 0,
        };
        await onSaveFeed(feed);
        count++;
      }
      setStatusMessage(`Successfully imported ${count} feeds from OPML!`);
    } catch (err: any) {
      setStatusMessage('Failed to import OPML file.');
    }
  };

  const handleSaveFeedItemToVault = async (item: any) => {
    try {
      const extracted = extractArticleFromHtml(
        item.content || `<p>${item.summary}</p>`,
        item.link
      );

      const article: Article = {
        id: 'art-' + Math.random().toString(36).substring(2, 9),
        url: item.link,
        title: item.title,
        byline: item.author || extracted.byline,
        excerpt: item.summary || extracted.excerpt,
        content_html: extracted.content_html,
        content_markdown: extracted.content_markdown,
        site_name: selectedFeed?.title || extracted.site_name,
        published_at: item.pubDate || new Date().toISOString(),
        saved_at: new Date().toISOString(),
        read_at: null,
        status: 'inbox',
        favorite: 0,
        reading_time_minutes: extracted.reading_time_minutes,
        word_count: extracted.word_count,
        scroll_progress: 0,
        tags: ['rss', selectedFeed?.title.toLowerCase().replace(/\s+/g, '-') || 'feed'],
        rss_source_id: selectedFeed?.id || null,
      };

      await onSaveArticle(article);
      setSavedArticleLinks((prev) => new Set(prev).add(item.link));
    } catch (err: any) {
      alert('Failed saving feed item: ' + err.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="RSS & Atom Feeds" maxWidth="max-w-4xl">
      <div className="flex flex-col md:flex-row gap-4 h-[65vh] text-xs">
        {/* Left column: Feed subscriptions & add form */}
        <div className="w-full md:w-64 shrink-0 flex flex-col justify-between border-r border-[var(--border-color)] pr-4 space-y-4">
          <div className="space-y-3">
            {/* Add Feed Form */}
            <form onSubmit={handleAddFeed} className="space-y-1.5">
              <label className="font-semibold text-[var(--text-secondary)]">Subscribe to Feed</label>
              <div className="flex gap-1">
                <input
                  type="url"
                  required
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                  placeholder="https://.../rss.xml"
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={isAddingFeed}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
                  title="Add RSS Feed"
                >
                  {isAddingFeed ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
              </div>
            </form>

            {/* Subscribed feeds list */}
            <div className="space-y-1 overflow-y-auto max-h-[35vh]">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1">
                Subscriptions ({feeds.length})
              </span>
              {feeds.map((f) => (
                <div
                  key={f.id}
                  onClick={() => loadFeedArticles(f)}
                  className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedFeed?.id === f.id
                      ? 'bg-blue-500/15 text-blue-600 font-medium'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Rss className="w-3 h-3 text-amber-500 shrink-0" />
                    <span className="truncate">{f.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Unsubscribe from ${f.title}?`)) {
                        onDeleteFeed(f.id);
                        if (selectedFeed?.id === f.id) setSelectedFeed(null);
                      }
                    }}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                    title="Unsubscribe"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* OPML Import */}
          <div className="pt-3 border-t border-[var(--border-color)]">
            <label className="cursor-pointer flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] font-medium">
              <FileCode className="w-3.5 h-3.5" />
              <span>Import OPML</span>
              <input
                type="file"
                accept=".opml,.xml"
                className="hidden"
                onChange={(e) => handleImportOpml(e.target.files)}
              />
            </label>
          </div>
        </div>

        {/* Right column: Feed articles list */}
        <div className="flex-1 flex flex-col overflow-y-auto pl-2">
          {statusMessage && (
            <div className="p-2 mb-3 rounded-lg bg-blue-500/10 text-blue-600 text-xs">
              {statusMessage}
            </div>
          )}

          {isLoadingFeed ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span>Fetching and parsing live feed items...</span>
            </div>
          ) : feedData ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">{feedData.title}</h4>
                  <p className="text-[11px] text-[var(--text-muted)]">{feedData.description}</p>
                </div>
                {selectedFeed && (
                  <button
                    onClick={() => loadFeedArticles(selectedFeed)}
                    className="p-1.5 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    title="Refresh Feed"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {feedData.items.map((item) => {
                  const isSaved = savedArticleLinks.has(item.link);
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-blue-500/40 transition-colors space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-xs text-[var(--text-primary)] hover:text-blue-500 transition-colors flex items-center gap-1.5"
                        >
                          <span>{item.title}</span>
                          <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
                        </a>

                        <button
                          onClick={() => handleSaveFeedItemToVault(item)}
                          disabled={isSaved}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors shrink-0 ${
                            isSaved
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {isSaved ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Saved</span>
                            </>
                          ) : (
                            <>
                              <BookDown className="w-3 h-3" />
                              <span>Save to Vault</span>
                            </>
                          )}
                        </button>
                      </div>

                      {item.summary && (
                        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2">
                          {item.summary}
                        </p>
                      )}

                      <div className="text-[10px] text-[var(--text-muted)]">
                        {new Date(item.pubDate).toLocaleDateString()} {item.author ? `• by ${item.author}` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] space-y-2">
              <Rss className="w-8 h-8 opacity-40 text-amber-500" />
              <p className="text-xs">Select or subscribe to a feed to read articles.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
