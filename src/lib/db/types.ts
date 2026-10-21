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
  summary_bullets?: string[]; // Auto-generated executive takeaways
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

export interface Flashcard {
  id: string;
  highlight_id: string;
  article_id: string;
  article_title: string;
  front: string; // The highlight quote or prompt
  back: string;  // The user's margin note or contextual answer
  color: HighlightColor;
  next_review_at: string; // ISO date string
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  last_reviewed_at: string | null;
}

export interface SmartView {
  id: string;
  name: string;
  iconName: string;
  description: string;
  filter: {
    status?: ArticleStatus;
    favorite?: boolean;
    minReadingTime?: number;
    maxReadingTime?: number;
    minHighlights?: number;
    tag?: string;
  };
}

export interface AISettings {
  provider: 'offline' | 'ollama' | 'openai' | 'groq';
  endpoint: string;
  apiKey: string;
  model: string;
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
  dueFlashcardsCount: number;
  totalWordsRead: number;
  estimatedMinutesRead: number;
  streakDays: number;
  domainCounts: { domain: string; count: number }[];
  tagCounts: { tag: string; count: number }[];
}
