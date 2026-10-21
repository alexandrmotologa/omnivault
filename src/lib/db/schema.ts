export const SCHEMA_SQL = `
-- Main articles table
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  byline TEXT,
  excerpt TEXT,
  content_html TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  site_name TEXT,
  published_at TEXT,
  saved_at TEXT NOT NULL,
  read_at TEXT,
  status TEXT NOT NULL DEFAULT 'inbox',
  favorite INTEGER NOT NULL DEFAULT 0,
  reading_time_minutes INTEGER NOT NULL DEFAULT 1,
  word_count INTEGER NOT NULL DEFAULT 0,
  scroll_progress REAL NOT NULL DEFAULT 0.0,
  tags TEXT NOT NULL DEFAULT '[]',
  rss_source_id TEXT
);

-- Indexing for fast status/date lookups
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_saved_at ON articles(saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_favorite ON articles(favorite);

-- Highlights table
CREATE TABLE IF NOT EXISTS highlights (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  text TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT 'yellow',
  prefix TEXT NOT NULL DEFAULT '',
  suffix TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_highlights_article ON highlights(article_id);

-- Tags catalog
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6'
);

-- RSS Feeds subscription list
CREATE TABLE IF NOT EXISTS rss_feeds (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  site_url TEXT NOT NULL DEFAULT '',
  icon_url TEXT NOT NULL DEFAULT '',
  last_fetched_at TEXT,
  unread_count INTEGER NOT NULL DEFAULT 0
);

-- Reading session logs for telemetry & streaks
CREATE TABLE IF NOT EXISTS reading_logs (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  words_read INTEGER NOT NULL DEFAULT 0,
  timestamp TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reading_logs_time ON reading_logs(timestamp DESC);

-- Full-Text Search Virtual Table using SQLite FTS5 with Porter Stemmer
CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
  id UNINDEXED,
  title,
  content_markdown,
  excerpt,
  byline,
  site_name,
  tags,
  tokenize = 'porter unicode61'
);

-- Triggers to keep FTS5 automatically synchronized
CREATE TRIGGER IF NOT EXISTS trg_articles_ai AFTER INSERT ON articles BEGIN
  INSERT INTO articles_fts(id, title, content_markdown, excerpt, byline, site_name, tags)
  VALUES (new.id, new.title, new.content_markdown, new.excerpt, new.byline, new.site_name, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS trg_articles_ad AFTER DELETE ON articles BEGIN
  DELETE FROM articles_fts WHERE id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_articles_au AFTER UPDATE ON articles BEGIN
  DELETE FROM articles_fts WHERE id = old.id;
  INSERT INTO articles_fts(id, title, content_markdown, excerpt, byline, site_name, tags)
  VALUES (new.id, new.title, new.content_markdown, new.excerpt, new.byline, new.site_name, new.tags);
END;
`;
