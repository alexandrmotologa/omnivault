import React from 'react';
import { Modal } from '../common/Modal';
import {
  BookOpen,
  Flame,
  Clock,
  Highlighter,
  Globe,
  Tag,
  CheckCircle2,
  Inbox,
  Star,
} from 'lucide-react';
import { VaultStats } from '../../lib/db/types';

interface AnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
  stats: VaultStats | null;
}

export const AnalyticsDashboard: React.FC<AnalyticsProps> = ({ isOpen, onClose, stats }) => {
  if (!stats) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reading Analytics & Vault Health" maxWidth="max-w-2xl">
      <div className="space-y-6 text-xs">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/40 space-y-1">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-medium">
              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
              <span>Total Saved</span>
            </div>
            <div className="text-xl font-bold text-[var(--text-primary)]">
              {stats.totalArticles}
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              {stats.inboxCount} in inbox
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/40 space-y-1">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-medium">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Reading Streak</span>
            </div>
            <div className="text-xl font-bold text-amber-500 flex items-center gap-1">
              <span>{stats.streakDays}</span>
              <span className="text-xs font-normal">days</span>
            </div>
            <div className="text-[10px] text-emerald-600 font-medium">Active today</div>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/40 space-y-1">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Time Read</span>
            </div>
            <div className="text-xl font-bold text-[var(--text-primary)]">
              {stats.estimatedMinutesRead}m
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              ~{stats.totalWordsRead.toLocaleString()} words
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/40 space-y-1">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-medium">
              <Highlighter className="w-3.5 h-3.5 text-purple-500" />
              <span>Highlights</span>
            </div>
            <div className="text-xl font-bold text-[var(--text-primary)]">
              {stats.totalHighlights}
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              with margin notes
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-3">
          <h4 className="font-semibold text-sm text-[var(--text-primary)]">
            Article Distribution
          </h4>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-lg bg-[var(--bg-secondary)] space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-[var(--text-muted)]">
                <Inbox className="w-3 h-3" />
                <span className="text-[11px]">Inbox</span>
              </div>
              <div className="text-base font-bold text-[var(--text-primary)]">
                {stats.inboxCount}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-[var(--bg-secondary)] space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-blue-500">
                <BookOpen className="w-3 h-3" />
                <span className="text-[11px]">Reading</span>
              </div>
              <div className="text-base font-bold text-[var(--text-primary)]">
                {stats.readingCount}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-[var(--bg-secondary)] space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-emerald-500">
                <CheckCircle2 className="w-3 h-3" />
                <span className="text-[11px]">Archived</span>
              </div>
              <div className="text-base font-bold text-[var(--text-primary)]">
                {stats.archivedCount}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-[var(--bg-secondary)] space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-amber-500">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-[11px]">Favorites</span>
              </div>
              <div className="text-base font-bold text-[var(--text-primary)]">
                {stats.favoriteCount}
              </div>
            </div>
          </div>
        </div>

        {/* Domains & Tags Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Top Sources */}
          <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-3">
            <h4 className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span>Top Knowledge Sources</span>
            </h4>
            <div className="space-y-1.5">
              {stats.domainCounts.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)] truncate">{d.domain}</span>
                  <span className="font-mono text-[var(--text-muted)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded text-[10px]">
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags cloud */}
          <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-3">
            <h4 className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-500" />
              <span>Top Research Tags</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {stats.tagCounts.map((t, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-mono text-[11px]"
                >
                  #{t.tag} ({t.count})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
