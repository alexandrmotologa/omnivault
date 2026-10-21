export type ArticleStatus = 'inbox' | 'reading' | 'archived' | 'trash';

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'purple' | 'pink';

export interface Article {
  id: string;
  url: string;
  title: string;
  byline: string;
  excerpt: string;
  content_html: string;
  content_markdown: string;
  site_name: string;
  published_at: string;
  saved_at: string;
  read_at: string | null;
  status: ArticleStatus;
  favorite: number; // 0 or 1
  reading_time_minutes: number;
  word_count: number;
  scroll_progress: number; // 0.0 to 1.0
  tags: string[]; // parsed from JSON string or comma-separated
  rss_source_id: string | null;
}

export interface Highlight {
  id: string;
  article_id: string;
  text: string;
  note: string;
  color: HighlightColor;
  prefix: string;
  suffix: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface RssFeed {
  id: string;
  title: string;
  url: string;
  site_url: string;
  icon_url: string;
  last_fetched_at: string | null;
  unread_count: number;
}

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  byline: string;
  site_name: string;
  excerpt: string;
  status: ArticleStatus;
  saved_at: string;
  tags: string[];
  reading_time_minutes: number;
  snippet_title?: string;
  snippet_content?: string;
  rank?: number;
}

export interface ReadingLog {
  id: string;
  article_id: string;
  duration_seconds: number;
  words_read: number;
  timestamp: string;
}

export interface VaultStats {
  totalArticles: number;
  inboxCount: number;
  readingCount: number;
  archivedCount: number;
  trashCount: number;
  favoriteCount: number;
  totalHighlights: number;
  totalWordsRead: number;
  estimatedMinutesRead: number;
  streakDays: number;
  domainCounts: { domain: string; count: number }[];
  tagCounts: { tag: string; count: number }[];
}
