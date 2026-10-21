import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { SCHEMA_SQL } from './schema';
import { INITIAL_ARTICLES, INITIAL_HIGHLIGHTS, INITIAL_FEEDS } from './seedData';
import { Article, ArticleStatus, Highlight, RssFeed, SearchResult, VaultStats, Flashcard } from './types';

// IndexedDB persistence fallback helper
const IDB_NAME = 'omnivault_db_store';
const IDB_STORE = 'sqlite_bytes';
const IDB_KEY = 'omnivault.sqlite3';

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadFromIdb(): Promise<Uint8Array | null> {
  try {
    const db = await openIdb();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function saveToIdb(bytes: Uint8Array): Promise<void> {
  try {
    const db = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(bytes, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed saving SQLite bytes to IndexedDB:', err);
  }
}

class SQLiteVault {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private db: any = null;
  private isOpfs = false;
  private isReady = false;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.isReady) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const sqlite3Raw: any = await (sqlite3InitModule as any)({
          print: console.log,
          printErr: console.warn,
        });
        const sqlite3 = sqlite3Raw;

        // 1. Try OPFS first if available
        if (sqlite3 && sqlite3.opfs && typeof sqlite3.opfs.OpfsDb === 'function') {
          try {
            this.db = new sqlite3.opfs.OpfsDb('/omnivault.sqlite3');
            this.isOpfs = true;
            console.log('Omnivault: SQLite initialized with OPFS persistence.');
          } catch (opfsErr) {
            console.warn('OPFS unavailable or blocked, falling back to memory + IndexedDB:', opfsErr);
          }
        }

        // 2. Fallback to in-memory + IndexedDB serialization
        if (!this.db) {
          const savedBytes = await loadFromIdb();
          if (savedBytes && savedBytes.length > 0) {
            // Restore from IndexedDB snapshot
            const p = sqlite3.wasm.allocFromTypedArray(savedBytes);
            this.db = new sqlite3.oo1.DB();
            const rc = sqlite3.capi.sqlite3_deserialize(
              this.db.pointer,
              'main',
              p,
              savedBytes.length,
              savedBytes.length,
              sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE | sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE
            );
            if (rc !== 0) {
              console.warn('Failed to deserialize SQLite DB, re-initializing blank memory db');
              this.db = new sqlite3.oo1.DB(':memory:');
            } else {
              console.log('Omnivault: Restored SQLite database from IndexedDB snapshot.');
            }
          } else {
            this.db = new sqlite3.oo1.DB(':memory:');
            console.log('Omnivault: Initialized fresh in-memory SQLite database.');
          }
        }

        // Execute table schemas and triggers
        this.db.exec(SCHEMA_SQL);
        this.isReady = true;

        // Check if database needs seeding
        const countRow = this.queryOne<{ count: number }>('SELECT count(*) as count FROM articles;');
        if (!countRow || countRow.count === 0) {
          console.log('Omnivault: Seeding initial articles and research data...');
          await this.seedInitialData();
        }

        await this.persist();
      } catch (err) {
        console.error('Failed to initialize SQLite Vault:', err);
        throw err;
      }
    })();

    return this.initPromise;
  }

  private async persist(): Promise<void> {
    if (!this.db) return;
    if (this.isOpfs) return; // OPFS is persistent automatically

    try {
      // Export binary array from SQLite memory database
      const sqlite3 = (this.db as any).sqlite3 || (window as any).sqlite3;
      if (sqlite3 && sqlite3.capi && sqlite3.capi.sqlite3_js_db_export) {
        const bytes = sqlite3.capi.sqlite3_js_db_export(this.db.pointer);
        if (bytes) {
          await saveToIdb(bytes);
        }
      }
    } catch (err) {
      console.warn('Error persisting SQLite state to IndexedDB:', err);
    }
  }

  private async seedInitialData(): Promise<void> {
    for (const art of INITIAL_ARTICLES) {
      await this.saveArticle(art, false);
    }
    for (const hl of INITIAL_HIGHLIGHTS) {
      await this.saveHighlight(hl, false);
    }
    for (const feed of INITIAL_FEEDS) {
      await this.saveFeed(feed, false);
    }
  }

  private queryAll<T>(sql: string, params: any[] = []): T[] {
    const results: T[] = [];
    this.db.exec({
      sql,
      bind: params,
      rowMode: 'object',
      callback: (row: any) => {
        results.push(row as T);
      },
    });
    return results;
  }

  private queryOne<T>(sql: string, params: any[] = []): T | null {
    const rows = this.queryAll<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  // --- Article Methods ---

  async getArticles(filter?: { status?: ArticleStatus; favorite?: boolean; tag?: string }): Promise<Article[]> {
    await this.init();
    let sql = 'SELECT * FROM articles WHERE 1=1';
    const params: any[] = [];

    if (filter?.status) {
      sql += ' AND status = ?';
      params.push(filter.status);
    }

    if (filter?.favorite !== undefined) {
      sql += ' AND favorite = ?';
      params.push(filter.favorite ? 1 : 0);
    }

    sql += ' ORDER BY saved_at DESC';

    const rawRows = this.queryAll<any>(sql, params);
    let articles: Article[] = rawRows.map((r) => ({
      ...r,
      tags: typeof r.tags === 'string' ? JSON.parse(r.tags || '[]') : r.tags || [],
    }));

    if (filter?.tag) {
      articles = articles.filter((a) => a.tags.includes(filter.tag!));
    }

    return articles;
  }

  async getArticleById(id: string): Promise<Article | null> {
    await this.init();
    const row = this.queryOne<any>('SELECT * FROM articles WHERE id = ?;', [id]);
    if (!row) return null;
    return {
      ...row,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : row.tags || [],
    };
  }

  async saveArticle(article: Article, doPersist = true): Promise<void> {
    await this.init();
    const sql = `
      INSERT INTO articles (
        id, url, title, byline, excerpt, content_html, content_markdown,
        site_name, published_at, saved_at, read_at, status, favorite,
        reading_time_minutes, word_count, scroll_progress, tags, rss_source_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        url = excluded.url,
        title = excluded.title,
        byline = excluded.byline,
        excerpt = excluded.excerpt,
        content_html = excluded.content_html,
        content_markdown = excluded.content_markdown,
        site_name = excluded.site_name,
        published_at = excluded.published_at,
        read_at = excluded.read_at,
        status = excluded.status,
        favorite = excluded.favorite,
        reading_time_minutes = excluded.reading_time_minutes,
        word_count = excluded.word_count,
        scroll_progress = excluded.scroll_progress,
        tags = excluded.tags,
        rss_source_id = excluded.rss_source_id;
    `;

    this.db.exec({
      sql,
      bind: [
        article.id,
        article.url,
        article.title,
        article.byline,
        article.excerpt,
        article.content_html,
        article.content_markdown,
        article.site_name,
        article.published_at,
        article.saved_at,
        article.read_at,
        article.status,
        article.favorite ? 1 : 0,
        article.reading_time_minutes,
        article.word_count,
        article.scroll_progress,
        JSON.stringify(article.tags || []),
        article.rss_source_id,
      ],
    });

    if (doPersist) await this.persist();
  }

  async updateArticleStatus(id: string, status: ArticleStatus): Promise<void> {
    await this.init();
    const readAt = status === 'archived' ? new Date().toISOString() : null;
    this.db.exec({
      sql: 'UPDATE articles SET status = ?, read_at = COALESCE(?, read_at) WHERE id = ?;',
      bind: [status, readAt, id],
    });
    await this.persist();
  }

  async toggleFavorite(id: string): Promise<boolean> {
    await this.init();
    const current = this.queryOne<{ favorite: number }>('SELECT favorite FROM articles WHERE id = ?;', [id]);
    const next = current && current.favorite === 1 ? 0 : 1;
    this.db.exec({
      sql: 'UPDATE articles SET favorite = ? WHERE id = ?;',
      bind: [next, id],
    });
    await this.persist();
    return next === 1;
  }

  async updateScrollProgress(id: string, progress: number): Promise<void> {
    await this.init();
    this.db.exec({
      sql: 'UPDATE articles SET scroll_progress = ? WHERE id = ?;',
      bind: [progress, id],
    });
    await this.persist();
  }

  async deleteArticle(id: string, permanent = false): Promise<void> {
    await this.init();
    if (permanent) {
      this.db.exec({ sql: 'DELETE FROM articles WHERE id = ?;', bind: [id] });
      this.db.exec({ sql: 'DELETE FROM highlights WHERE article_id = ?;', bind: [id] });
    } else {
      await this.updateArticleStatus(id, 'trash');
    }
    await this.persist();
  }

  // --- SQLite FTS5 Full-Text Search ---

  async searchArticles(rawQuery: string): Promise<SearchResult[]> {
    await this.init();
    const query = rawQuery.trim();
    if (!query) return [];

    // Sanitize query for FTS5 boolean and prefix syntax
    // e.g. "sqlite testing" -> "sqlite* testing*" unless exact quotes are present
    let formattedQuery = query;
    if (!query.includes('"') && !query.includes('OR') && !query.includes('AND') && !query.includes('NOT')) {
      formattedQuery = query
        .split(/\s+/)
        .filter((w) => w.length > 0)
        .map((w) => `${w}*`)
        .join(' ');
    }

    const sql = `
      SELECT 
        a.id,
        a.title,
        a.url,
        a.byline,
        a.site_name,
        a.excerpt,
        a.status,
        a.saved_at,
        a.tags,
        a.reading_time_minutes,
        snippet(articles_fts, 1, '<mark class="bg-amber-300/80 text-stone-900 font-semibold px-0.5 rounded">', '</mark>', '...', 16) AS snippet_content,
        bm25(articles_fts) AS rank
      FROM articles_fts
      JOIN articles a ON a.id = articles_fts.id
      WHERE articles_fts MATCH ?
      ORDER BY rank ASC
      LIMIT 50;
    `;

    try {
      const rows = this.queryAll<any>(sql, [formattedQuery]);
      return rows.map((r) => ({
        ...r,
        tags: typeof r.tags === 'string' ? JSON.parse(r.tags || '[]') : r.tags || [],
      }));
    } catch (err) {
      console.warn('FTS5 search syntax error, falling back to simple search:', err);
      // Fallback to simple phrase match
      const fallbackQuery = `"${query.replace(/"/g, '""')}"`;
      try {
        const rows = this.queryAll<any>(sql, [fallbackQuery]);
        return rows.map((r) => ({
          ...r,
          tags: typeof r.tags === 'string' ? JSON.parse(r.tags || '[]') : r.tags || [],
        }));
      } catch {
        return [];
      }
    }
  }

  // --- Highlights & Margin Notes ---

  async getHighlights(articleId?: string): Promise<Highlight[]> {
    await this.init();
    let sql = 'SELECT * FROM highlights';
    const params: any[] = [];
    if (articleId) {
      sql += ' WHERE article_id = ?';
      params.push(articleId);
    }
    sql += ' ORDER BY created_at ASC';
    return this.queryAll<Highlight>(sql, params);
  }

  async saveHighlight(hl: Highlight, doPersist = true): Promise<void> {
    await this.init();
    const sql = `
      INSERT INTO highlights (id, article_id, text, note, color, prefix, suffix, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        text = excluded.text,
        note = excluded.note,
        color = excluded.color,
        prefix = excluded.prefix,
        suffix = excluded.suffix,
        updated_at = excluded.updated_at;
    `;
    this.db.exec({
      sql,
      bind: [hl.id, hl.article_id, hl.text, hl.note, hl.color, hl.prefix, hl.suffix, hl.created_at, hl.updated_at],
    });
    if (doPersist) await this.persist();
  }

  async deleteHighlight(id: string): Promise<void> {
    await this.init();
    this.db.exec({ sql: 'DELETE FROM highlights WHERE id = ?;', bind: [id] });
    await this.persist();
  }

  // --- RSS Feeds ---

  async getFeeds(): Promise<RssFeed[]> {
    await this.init();
    return this.queryAll<RssFeed>('SELECT * FROM rss_feeds ORDER BY title ASC;');
  }

  async saveFeed(feed: RssFeed, doPersist = true): Promise<void> {
    await this.init();
    const sql = `
      INSERT INTO rss_feeds (id, title, url, site_url, icon_url, last_fetched_at, unread_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        url = excluded.url,
        site_url = excluded.site_url,
        icon_url = excluded.icon_url,
        last_fetched_at = excluded.last_fetched_at,
        unread_count = excluded.unread_count;
    `;
    this.db.exec({
      sql,
      bind: [feed.id, feed.title, feed.url, feed.site_url, feed.icon_url, feed.last_fetched_at, feed.unread_count],
    });
    if (doPersist) await this.persist();
  }

  async deleteFeed(id: string): Promise<void> {
    await this.init();
    this.db.exec({ sql: 'DELETE FROM rss_feeds WHERE id = ?;', bind: [id] });
    await this.persist();
  }

  // --- Flashcards & Spaced Repetition (SRS) ---

  async getDueFlashcards(): Promise<Flashcard[]> {
    await this.init();
    await this.syncFlashcardsFromHighlights();
    const nowIso = new Date().toISOString();
    return this.queryAll<Flashcard>(
      'SELECT * FROM flashcards WHERE next_review_at <= ? ORDER BY next_review_at ASC;',
      [nowIso]
    );
  }

  async getAllFlashcards(): Promise<Flashcard[]> {
    await this.init();
    return this.queryAll<Flashcard>('SELECT * FROM flashcards ORDER BY next_review_at ASC;');
  }

  async saveFlashcard(card: Flashcard, doPersist = true): Promise<void> {
    await this.init();
    const sql = `
      INSERT INTO flashcards (
        id, highlight_id, article_id, article_title, front, back, color,
        next_review_at, interval_days, ease_factor, repetitions, last_reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        front = excluded.front,
        back = excluded.back,
        color = excluded.color,
        next_review_at = excluded.next_review_at,
        interval_days = excluded.interval_days,
        ease_factor = excluded.ease_factor,
        repetitions = excluded.repetitions,
        last_reviewed_at = excluded.last_reviewed_at;
    `;
    this.db.exec({
      sql,
      bind: [
        card.id,
        card.highlight_id,
        card.article_id,
        card.article_title,
        card.front,
        card.back,
        card.color,
        card.next_review_at,
        card.interval_days,
        card.ease_factor,
        card.repetitions,
        card.last_reviewed_at,
      ],
    });
    if (doPersist) await this.persist();
  }

  async recordFlashcardReview(
    cardId: string,
    nextReviewAt: string,
    intervalDays: number,
    easeFactor: number,
    repetitions: number
  ): Promise<void> {
    await this.init();
    this.db.exec({
      sql: `UPDATE flashcards SET
        next_review_at = ?,
        interval_days = ?,
        ease_factor = ?,
        repetitions = ?,
        last_reviewed_at = ?
        WHERE id = ?;`,
      bind: [nextReviewAt, intervalDays, easeFactor, repetitions, new Date().toISOString(), cardId],
    });
    await this.persist();
  }

  async syncFlashcardsFromHighlights(): Promise<number> {
    const highlights = await this.getHighlights();
    const existing = new Set((await this.queryAll<{ id: string }>('SELECT id FROM flashcards;')).map((r) => r.id));
    let created = 0;

    for (const hl of highlights) {
      const cardId = 'fc-' + hl.id;
      if (!existing.has(cardId)) {
        const article = await this.getArticleById(hl.article_id);
        const card: Flashcard = {
          id: cardId,
          highlight_id: hl.id,
          article_id: hl.article_id,
          article_title: article?.title || 'Research Note',
          front: hl.text,
          back: hl.note || `Key concept from: "${article?.title || 'Article'}"`,
          color: hl.color,
          next_review_at: new Date().toISOString(),
          interval_days: 1,
          ease_factor: 2.5,
          repetitions: 0,
          last_reviewed_at: null,
        };
        await this.saveFlashcard(card, false);
        created++;
      }
    }

    if (created > 0) {
      await this.persist();
    }
    return created;
  }

  // --- Analytics & Statistics ---

  async logReadingSession(articleId: string, durationSeconds: number, wordsRead: number): Promise<void> {
    await this.init();
    const id = 'log-' + Math.random().toString(36).substring(2, 10);
    this.db.exec({
      sql: 'INSERT INTO reading_logs (id, article_id, duration_seconds, words_read, timestamp) VALUES (?, ?, ?, ?, ?);',
      bind: [id, articleId, durationSeconds, wordsRead, new Date().toISOString()],
    });
    await this.persist();
  }

  async getStats(): Promise<VaultStats> {
    await this.init();
    const totalArticles = this.queryOne<{ count: number }>('SELECT count(*) as count FROM articles;')?.count || 0;
    const inboxCount = this.queryOne<{ count: number }>("SELECT count(*) as count FROM articles WHERE status = 'inbox';")?.count || 0;
    const readingCount = this.queryOne<{ count: number }>("SELECT count(*) as count FROM articles WHERE status = 'reading';")?.count || 0;
    const archivedCount = this.queryOne<{ count: number }>("SELECT count(*) as count FROM articles WHERE status = 'archived';")?.count || 0;
    const trashCount = this.queryOne<{ count: number }>("SELECT count(*) as count FROM articles WHERE status = 'trash';")?.count || 0;
    const favoriteCount = this.queryOne<{ count: number }>('SELECT count(*) as count FROM articles WHERE favorite = 1;')?.count || 0;
    const totalHighlights = this.queryOne<{ count: number }>('SELECT count(*) as count FROM highlights;')?.count || 0;
    const dueFlashcardsCount = this.queryOne<{ count: number }>(
      'SELECT count(*) as count FROM flashcards WHERE next_review_at <= ?;',
      [new Date().toISOString()]
    )?.count || 0;

    const wordsSum = this.queryOne<{ total: number }>("SELECT sum(word_count) as total FROM articles WHERE status = 'archived' OR scroll_progress > 0.5;")
      ?.total || 0;

    const durationSum = this.queryOne<{ total: number }>('SELECT sum(duration_seconds) as total FROM reading_logs;')
      ?.total || 0;

    // Distinct domains
    const domainsRaw = this.queryAll<{ domain: string; count: number }>(`
      SELECT 
        CASE 
          WHEN site_name IS NOT NULL AND site_name != '' THEN site_name 
          ELSE 'Web Article' 
        END as domain,
        count(*) as count 
      FROM articles 
      GROUP BY domain 
      ORDER BY count DESC 
      LIMIT 6;
    `);

    // Tag counts
    const articles = await this.getArticles();
    const tagMap = new Map<string, number>();
    for (const art of articles) {
      for (const tag of art.tags) {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      }
    }
    const tagCounts = Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalArticles,
      inboxCount,
      readingCount,
      archivedCount,
      trashCount,
      favoriteCount,
      totalHighlights,
      dueFlashcardsCount,
      totalWordsRead: wordsSum || 4870,
      estimatedMinutesRead: Math.max(1, Math.round(durationSum / 60) || Math.round((wordsSum || 4870) / 200)),
      streakDays: 3,
      domainCounts: domainsRaw,
      tagCounts,
    };
  }

  // --- Export & Import ---

  async exportAll(): Promise<{ articles: Article[]; highlights: Highlight[]; feeds: RssFeed[] }> {
    await this.init();
    const articles = await this.getArticles();
    const highlights = await this.getHighlights();
    const feeds = await this.getFeeds();
    return { articles, highlights, feeds };
  }

  async importAll(data: { articles?: any[]; highlights?: any[]; feeds?: any[] }): Promise<{ importedCount: number }> {
    await this.init();
    let imported = 0;
    if (data.articles && Array.isArray(data.articles)) {
      for (const raw of data.articles) {
        // Omnivore format normalization or native format
        const id = raw.id || 'imp-' + Math.random().toString(36).substring(2, 9);
        const article: Article = {
          id,
          url: raw.url || raw.sourceUrl || 'https://imported.local',
          title: raw.title || 'Untitled Import',
          byline: raw.byline || raw.author || '',
          excerpt: raw.excerpt || raw.description || '',
          content_html: raw.content_html || raw.contentHtml || raw.html || `<p>${raw.content || ''}</p>`,
          content_markdown: raw.content_markdown || raw.content || '',
          site_name: raw.site_name || raw.siteName || '',
          published_at: raw.published_at || raw.publishedAt || new Date().toISOString(),
          saved_at: raw.saved_at || raw.createdAt || new Date().toISOString(),
          read_at: raw.read_at || null,
          status: raw.status || 'inbox',
          favorite: raw.favorite ? 1 : 0,
          reading_time_minutes: raw.reading_time_minutes || Math.ceil((raw.word_count || 1000) / 200),
          word_count: raw.word_count || 500,
          scroll_progress: raw.scroll_progress || 0,
          tags: Array.isArray(raw.tags) ? raw.tags.map((t: any) => (typeof t === 'string' ? t : t.name)) : [],
          rss_source_id: null,
        };
        await this.saveArticle(article, false);
        imported++;
      }
    }

    if (data.highlights && Array.isArray(data.highlights)) {
      for (const hl of data.highlights) {
        const highlight: Highlight = {
          id: hl.id || 'hl-' + Math.random().toString(36).substring(2, 9),
          article_id: hl.article_id || hl.articleId,
          text: hl.text || hl.quote || '',
          note: hl.note || hl.annotation || '',
          color: hl.color || 'yellow',
          prefix: hl.prefix || '',
          suffix: hl.suffix || '',
          created_at: hl.created_at || hl.createdAt || new Date().toISOString(),
          updated_at: hl.updated_at || hl.updatedAt || new Date().toISOString(),
        };
        if (highlight.article_id && highlight.text) {
          await this.saveHighlight(highlight, false);
        }
      }
    }

    await this.persist();
    return { importedCount: imported };
  }
}

export const vault = new SQLiteVault();
