# Omnivault Architecture

Omnivault is designed under local-first principles. The application is completely functional without external servers, accounts, or telemetry.

## Core Storage Layer

### SQLite WebAssembly + FTS5
The database layer uses `@sqlite.org/sqlite-wasm` 3.54 compiled with full virtual table capabilities.

1. **Schema Definition**:
   - `articles`: Primary records containing URL, title, clean HTML, Turndown Markdown, byline, tags, status, word count, and reading progress.
   - `highlights`: Text annotations with color identifiers, character offsets, and user margin notes.
   - `rss_feeds`: Subscription entries with metadata and polling timestamps.
   - `reading_logs`: Session telemetry tracking reading duration and streak statistics.
   - `articles_fts`: An SQLite virtual table using FTS5 with Porter stemmer tokenization:
     ```sql
     CREATE VIRTUAL TABLE articles_fts USING fts5(
       id UNINDEXED,
       title,
       content_markdown,
       excerpt,
       byline,
       site_name,
       tags,
       tokenize = 'porter unicode61'
     );
     ```

2. **Trigger-Based Synchronization**:
   Database triggers (`AFTER INSERT`, `AFTER UPDATE`, `AFTER DELETE`) automatically update `articles_fts` whenever the `articles` table changes, guaranteeing index consistency without manual reindexing jobs.

3. **Storage Persistence**:
   - **Primary**: Origin Private File System (`sqlite3.opfs.OpfsDb`), providing direct disk I/O in compatible browsers.
   - **Fallback**: In-memory database serialized to IndexedDB as an atomic Uint8Array binary snapshot upon commits.

---

## Article Processing Pipeline

```text
Target URL / HTML / EPUB
         │
         ▼
CORS Proxy Fallback Chain
         │
         ▼
DOMParser Parsing
         │
         ▼
Mozilla Readability Extraction (strips navigation, ads, sidebars)
         │
         ▼
DOMPurify Sanitization (removes unsafe scripts and iframes)
         │
         ▼
Turndown Markdown Conversion (retains code blocks and tables)
         │
         ▼
SQLite FTS5 Atomic Transaction
```

---

## On-Device Audio Engine

Omnivault provides speech playback through the browser Web Speech API (`SpeechSynthesis` and `SpeechSynthesisUtterance`).

- The parser segments clean article text into discrete paragraph and heading chunks.
- When playback starts, the engine tracks progress chunk by chunk, dispatching state changes to the UI.
- The Reader view observes the active chunk index, applies the `tts-speaking-current` class, and scrolls the paragraph into view.
- Reading rates between 0.75x and 2.0x are supported.

---

## PKM Export Engines

### Obsidian Vault
Articles are formatted as individual `.md` files:
- YAML frontmatter includes `title`, `source`, `author`, `tags`, `saved_date`, and `omnivault_id`.
- Highlights are formatted as Obsidian callout quotes (`> [!quote]`).
- Margin notes are formatted as nested callouts (`> [!note]`).
- Files are bundled into a downloadable ZIP via JSZip.

### Logseq Outliner
Articles are serialized using hierarchical bullet points:
- Page properties at the top (`title::`, `url::`, `tags::`).
- Highlights indented under an Outliner block (`- > quote` with child `- **Note:** note`).

---

## Spaced Repetition Architecture

The spaced repetition system transforms passive annotations into active memory retention:
- **Table Definition**: `flashcards` table stores `highlight_id`, `article_id`, `front_text`, `back_text`, `ease_factor`, `interval_days`, `repetitions`, `next_review_at`, and `state`.
- **Card Synchronization**: Automatically indexes user highlights where either a margin note exists or highlighted text exceeds 20 characters.
- **SM-2 Engine**: Review intervals double progressively with successful reviews and reset back to 1 day on `Again` selections.

---

## Knowledge Graph Engine

- **Physics Simulation**: Custom 2D force-directed layout executed on HTML5 Canvas.
- **Forces**:
  - Coulomb Repulsion: $F = k / d^2$ prevents node overlap.
  - Hooke Link Attraction: $F = -k \cdot (d - l_0)$ pulls connected articles and tags together.
  - Centering Gravity: pull nodes back toward the canvas origin.
  - Kinetic Damping: prevents continuous oscillation and stabilizes the graph into steady-state equilibrium.
- **Projection**: Canvas coordinates are transformed into world space for smooth interactive panning, dragging, and wheel zooming.

---

## Offline TextRank & AI Pipeline

- **TextRank Extractor**: Evaluates sentence relevance using undirected graph connectivity and word overlap scoring without external API calls.
- **Readability Index**: Calculates reading level by analyzing sentence length, syllable distribution, and vocabulary complexity.
- **BYOK LLM Client**: Optional client connects directly to local endpoints (Ollama at `localhost:11434`) or OpenAI-compatible gateways for user-directed synthesis and Q&A.

---

## PDF Ingestion Pipeline

- Files dropped with MIME type `application/pdf` are loaded into `pdfjs-dist`.
- Page text streams are extracted sequentially, preserving paragraph breaks.
- Metadata (Author, Title, Creation Date) is parsed from the PDF Document Information dictionary.
- Content is packaged into clean HTML and Markdown before insertion into the SQLite database.
