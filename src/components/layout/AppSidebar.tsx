import React from 'react';
import {
  Inbox,
  BookOpen,
  Star,
  Archive,
  Trash2,
  Tag as TagIcon,
  Highlighter,
  Database,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { ArticleStatus } from '../../lib/db/types';

interface SidebarProps {
  currentStatus: ArticleStatus | 'favorites' | 'highlights';
  onSelectStatus: (s: ArticleStatus | 'favorites' | 'highlights') => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  tags: { tag: string; count: number }[];
  counts: {
    inbox: number;
    reading: number;
    favorites: number;
    archived: number;
    trash: number;
    highlights: number;
  };
  onOpenBookmarklet: () => void;
}

export const AppSidebar: React.FC<SidebarProps> = ({
  currentStatus,
  onSelectStatus,
  selectedTag,
  onSelectTag,
  tags,
  counts,
  onOpenBookmarklet,
}) => {
  const navItems = [
    {
      id: 'inbox' as const,
      label: 'Inbox',
      icon: Inbox,
      count: counts.inbox,
    },
    {
      id: 'reading' as const,
      label: 'Reading',
      icon: BookOpen,
      count: counts.reading,
    },
    {
      id: 'favorites' as const,
      label: 'Favorites',
      icon: Star,
      count: counts.favorites,
    },
    {
      id: 'highlights' as const,
      label: 'All Highlights',
      icon: Highlighter,
      count: counts.highlights,
    },
    {
      id: 'archived' as const,
      label: 'Archive',
      icon: Archive,
      count: counts.archived,
    },
    {
      id: 'trash' as const,
      label: 'Trash',
      icon: Trash2,
      count: counts.trash,
    },
  ];

  return (
    <aside className="w-56 shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 border-r border-[var(--border-color)] bg-[var(--bg-secondary)]/40 p-3 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-6">
        {/* Navigation list */}
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentStatus === item.id && !selectedTag;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTag(null);
                  onSelectStatus(item.id);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[var(--text-muted)]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Tags filter list */}
        {tags.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              <span>Tags</span>
              {selectedTag && (
                <button
                  onClick={() => onSelectTag(null)}
                  className="text-[10px] lowercase hover:text-blue-500"
                >
                  clear
                </button>
              )}
            </div>
            <div className="space-y-0.5">
              {tags.map(({ tag, count }) => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => onSelectTag(isSelected ? null : tag)}
                    className={`w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <TagIcon className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                      <span className="truncate">#{tag}</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)]">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Local-First Engine & Bookmarklet status badge */}
      <div className="pt-4 border-t border-[var(--border-color)] space-y-2">
        <button
          onClick={onOpenBookmarklet}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <ExternalLink className="w-3 h-3" />
            1-Click Bookmarklet
          </span>
          <span className="text-[9px] bg-blue-500/10 text-blue-600 px-1 py-0.2 rounded font-mono">
            JS
          </span>
        </button>

        <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)]/70 border border-[var(--border-color)] text-[10px] space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="truncate">Local SQLite FTS5</span>
          </div>
          <div className="flex items-center gap-1 text-[var(--text-muted)]">
            <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
            <span>Zero cloud dependency.</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
