import React from 'react';
import {
  Star,
  Clock,
  ExternalLink,
  Archive,
  Inbox,
  Trash2,
  Highlighter,
  Globe,
} from 'lucide-react';
import { Article, ArticleStatus } from '../../lib/db/types';

interface ArticleCardProps {
  article: Article;
  highlightCount: number;
  onOpen: (article: Article) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onUpdateStatus: (id: string, status: ArticleStatus, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  snippet?: string;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  highlightCount,
  onOpen,
  onToggleFavorite,
  onUpdateStatus,
  onDelete,
  snippet,
}) => {
  const isArchived = article.status === 'archived';
  const isTrash = article.status === 'trash';

  // Domain extractor
  let domain = article.site_name;
  if (!domain && article.url) {
    try {
      domain = new URL(article.url).hostname.replace(/^www\./, '');
    } catch {
      domain = 'web';
    }
  }

  return (
    <div
      onClick={() => onOpen(article)}
      className="article-card group relative p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
      data-article-id={article.id}
    >
      <div className="space-y-2">
        {/* Card Header metadata */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-medium truncate">
            <Globe className="w-3 h-3 shrink-0" />
            <span className="truncate">{domain || 'Web Article'}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {highlightCount > 0 && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                <Highlighter className="w-2.5 h-2.5" />
                {highlightCount}
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
              <Clock className="w-3 h-3" />
              {article.reading_time_minutes} min
            </span>
          </div>
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
          {article.title}
        </h4>

        {/* Snippet or Excerpt */}
        {snippet ? (
          <p
            className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: snippet }}
          />
        ) : (
          article.excerpt && (
            <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
              {article.excerpt}
            </p>
          )
        )}

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)] font-mono"
              >
                #{tag}
              </span>
            ))}
            {article.tags.length > 3 && (
              <span className="text-[10px] text-[var(--text-muted)]">
                +{article.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Progress bar if partially read */}
      {article.scroll_progress > 0 && article.scroll_progress < 1 && (
        <div className="w-full bg-[var(--bg-secondary)] h-1 rounded-full overflow-hidden mt-3">
          <div
            className="bg-blue-500 h-full rounded-full transition-all"
            style={{ width: `${Math.round(article.scroll_progress * 100)}%` }}
          />
        </div>
      )}

      {/* Card Footer Actions */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-[var(--border-color)]/60 text-xs">
        <span className="text-[11px] text-[var(--text-muted)]">
          {new Date(article.saved_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </span>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              title="Open Original Webpage"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={(e) => onToggleFavorite(article.id, e)}
            className={`p-1 rounded transition-colors ${
              article.favorite
                ? 'text-amber-500 fill-amber-500 hover:text-amber-600'
                : 'text-[var(--text-muted)] hover:text-amber-500 hover:bg-[var(--bg-secondary)]'
            }`}
            title="Star Favorite"
          >
            <Star className={`w-3.5 h-3.5 ${article.favorite ? 'fill-current' : ''}`} />
          </button>

          {!isTrash && (
            <button
              onClick={(e) =>
                onUpdateStatus(article.id, isArchived ? 'inbox' : 'archived', e)
              }
              className="p-1 rounded text-[var(--text-muted)] hover:text-blue-500 hover:bg-[var(--bg-secondary)] transition-colors"
              title={isArchived ? 'Move back to Inbox' : 'Archive Article'}
            >
              {isArchived ? <Inbox className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={(e) => onDelete(article.id, e)}
            className="p-1 rounded text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--bg-secondary)] transition-colors"
            title={isTrash ? 'Permanently Delete' : 'Move to Trash'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
