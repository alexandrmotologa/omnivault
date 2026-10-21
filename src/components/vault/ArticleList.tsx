import React, { useState } from 'react';
import {
  LayoutGrid,
  List as ListIcon,
  BookOpen,
  Plus,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import { Article, ArticleStatus, Highlight, SearchResult } from '../../lib/db/types';
import { ArticleCard } from './ArticleCard';

interface ArticleListProps {
  articles: Article[];
  searchResults: SearchResult[] | null;
  searchQuery: string;
  highlights: Highlight[];
  currentStatus: ArticleStatus | 'favorites' | 'highlights';
  selectedTag: string | null;
  onOpenArticle: (article: Article) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onUpdateStatus: (id: string, status: ArticleStatus, e: React.MouseEvent) => void;
  onDeleteArticle: (id: string, e: React.MouseEvent) => void;
  onOpenClipModal: () => void;
  onClearSearch: () => void;
}

export const ArticleList: React.FC<ArticleListProps> = ({
  articles,
  searchResults,
  searchQuery,
  highlights,
  currentStatus,
  selectedTag,
  onOpenArticle,
  onToggleFavorite,
  onUpdateStatus,
  onDeleteArticle,
  onOpenClipModal,
  onClearSearch,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'time-asc' | 'title'>('date-desc');

  // Filter or search mode
  const isSearchMode = searchResults !== null;

  // Highlights Map for quick count lookup
  const highlightCountMap = new Map<string, number>();
  for (const hl of highlights) {
    highlightCountMap.set(hl.article_id, (highlightCountMap.get(hl.article_id) || 0) + 1);
  }

  // Sort articles
  const sortedArticles = [...articles].sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime();
    if (sortBy === 'date-asc') return new Date(a.saved_at).getTime() - new Date(b.saved_at).getTime();
    if (sortBy === 'time-asc') return a.reading_time_minutes - b.reading_time_minutes;
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return 0;
  });

  // Calculate search map for snippets
  const snippetMap = new Map<string, string>();
  if (searchResults) {
    for (const sr of searchResults) {
      if (sr.snippet_content) {
        snippetMap.set(sr.id, sr.snippet_content);
      }
    }
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      {/* Subheader bar: Status Title & View controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] capitalize flex items-center gap-2">
            {isSearchMode ? (
              <>
                <Search className="w-5 h-5 text-blue-500" />
                <span>Search: &ldquo;{searchQuery}&rdquo;</span>
              </>
            ) : selectedTag ? (
              `#${selectedTag}`
            ) : (
              currentStatus
            )}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {isSearchMode
              ? `Found ${searchResults.length} matching documents in SQLite FTS5 index`
              : `Showing ${sortedArticles.length} ${sortedArticles.length === 1 ? 'article' : 'articles'}`}
          </p>
        </div>

        {/* View mode & sort controls */}
        <div className="flex items-center gap-2">
          {isSearchMode && (
            <button
              onClick={onClearSearch}
              className="text-xs text-blue-600 hover:underline px-2"
            >
              Clear Search
            </button>
          )}

          <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-0.5 rounded-lg border border-[var(--border-color)]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs font-medium'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs font-medium'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="List View"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative flex items-center">
            <ArrowUpDown className="w-3 h-3 absolute left-2 text-[var(--text-muted)] pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="pl-6 pr-3 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="time-asc">Shortest Read</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {sortedArticles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[var(--border-color)] rounded-2xl bg-[var(--bg-secondary)]/20 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h4 className="text-base font-semibold text-[var(--text-primary)]">
              {isSearchMode ? 'No matching documents found' : 'Your research vault is ready'}
            </h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {isSearchMode
                ? 'Try querying with fewer keywords, prefix stems (e.g. "sql*"), or clear the search filter.'
                : 'Save interesting web articles, papers, or blog posts to read offline without ads.'}
            </p>
          </div>
          {isSearchMode ? (
            <button
              onClick={onClearSearch}
              className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs font-medium hover:bg-[var(--border-color)] transition-colors"
            >
              Reset Search
            </button>
          ) : (
            <button
              onClick={onOpenClipModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Save First Webpage</span>
            </button>
          )}
        </div>
      ) : (
        /* Articles Grid / List */
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
              : 'space-y-3'
          }
        >
          {sortedArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              highlightCount={highlightCountMap.get(article.id) || 0}
              onOpen={onOpenArticle}
              onToggleFavorite={onToggleFavorite}
              onUpdateStatus={onUpdateStatus}
              onDelete={onDeleteArticle}
              snippet={snippetMap.get(article.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
