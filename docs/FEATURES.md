# Omnivault Features

A detailed reference of features implemented in Omnivault.

## 1. Web Clipping & Ingestion

- **Direct URL Scraping**: Multi-tier proxy failover pipeline (direct fetch, AllOrigins, CORSProxy) extracts clean article text from remote websites without needing a custom server backend.
- **Manual Input**: Paste raw HTML or Markdown directly to create offline reading entries.
- **EPUB Book Reader**: Drop `.epub` files into the clipper modal to parse metadata, uncompress chapter files, and index the entire book for offline reading.
- **1-Click Bookmarklet**: Drag the provided bookmarklet button to your browser bookmarks bar to clip pages with one click.
- **RSS and Atom Feed Reader**: Subscribe to feeds, parse entries with XML DOMParser, and save articles into your vault.
- **OPML Import**: Import subscription lists exported from Feedly, Inoreader, or NetNewsWire.

---

## 2. Reading Experience & Ergonomics

- **Distraction-Free Layout**: Clean reader view stripped of advertisements, tracking scripts, and sidebars.
- **Color Themes**:
  - Paper (warm white)
  - Sepia (ivory parchment)
  - Charcoal (dark gray)
  - Nord (arctic slate)
  - OLED (true black)
- **Typography Controls**:
  - Typefaces: Serif (Georgia), Sans-Serif (System), Monospace (JetBrains Mono).
  - Font size adjustments from 14px to 26px.
  - Line height adjustments from 1.4 to 2.2.
  - Column width adjustments from 600px to 960px.
- **Bionic Reading**: Emboldens starting syllables in words to guide eye fixations.
- **Progress Tracking**: Real-time scroll indicator records read percentages. Reaching the end triggers a celebratory confetti banner.

---

## 3. Highlighting & Margin Notes

- **Multi-Color Palette**: Highlight passages in Amber, Emerald, Sky Blue, Purple, or Rose.
- **Margin Notes**: Attach commentary and research notes to any highlighted span.
- **Slide-Over Notes Drawer**:
  - Filter highlights by color.
  - Jump directly to passages in the article text.
  - Edit or delete notes inline.
  - Copy individual or all notes as Markdown quotes.

---

## 4. On-Device Text-to-Speech

- **Podcast Mode**: Listen to articles using installed system voices.
- **Karaoke Highlighting**: The currently read sentence or paragraph highlights and scrolls into viewport automatically.
- **Floating Controls**: Play, pause, skip forward/backward, and adjust reading speeds between 0.75x and 2.0x.
- **Voice Selection**: Choose between installed neural, natural, or system speech synthesizers.

---

## 5. SQLite FTS5 Full-Text Search

- **Indexed Fields**: Article title, content Markdown, excerpt, author byline, site domain, and tags.
- **BM25 Relevance Ranking**: Evaluates relevance scores to sort results by query accuracy.
- **Boolean & Prefix Syntax**: Supports queries such as `sqlite AND fts5 NOT cloud` or `distrib*`.
- **Search Snippets**: Live snippets show matched keywords highlighted with `<mark>` tags.

---

## 6. PKM Sync & Vault Migration

- **Obsidian Vault Export**: Generates a ZIP archive containing Markdown files formatted with Obsidian YAML frontmatter and callout quote blocks.
- **Logseq Outliner Export**: Generates a ZIP archive formatted with outliner bullets.
- **Complete JSON Backup**: Exports the entire SQLite database state into an open JSON structure.
- **Omnivore Migration**: Directly imports Omnivore exported archive files.

---

## 7. Spaced Repetition & Daily Review (SRS)

- **Automated Card Sync**: Derives flashcard decks directly from your highlights and margin notes.
- **SM-2 Leitner Scheduling**: Computes review intervals based on graded retention feedback:
  - Again: 1 day interval
  - Hard: 3 days interval
  - Good: 7 days interval
  - Easy: 14 days interval
- **Interactive Review Modal**: 3D card flipping, keyboard controls (`Space` to flip, `1` to `4` to grade), completion progress, and confetti celebrations.
- **Due Badges**: Real-time counter in navigation header and sidebar displays the number of flashcards due today.

---

## 8. Interactive Knowledge Graph View

- **Force-Directed Physics**: HTML5 2D Canvas engine simulates repulsion, spring link attraction, and center gravity.
- **Multi-Node Visual Taxonomy**:
  - Blue nodes: Articles and research papers
  - Emerald nodes: Topical tags
  - Purple nodes: Web domains and publishers
- **Exploration Controls**: Zoom with mouse wheel, drag to pan canvas, drag individual nodes to reorganize, search by keyword, and click to open articles directly.

---

## 9. Smart Offline Summarizer & BYOK AI

- **100% Offline TextRank**: Graph-based extractive summarizer scores sentences based on lexical centrality without sending data over the network.
- **Difficulty Grading**: Classifies reading difficulty into Accessible, Intermediate, and Deep Technical categories.
- **Bring-Your-Own-Key Assistant**: Optional support for local Ollama instances (`http://localhost:11434`) and OpenAI-compatible endpoints to answer questions about saved research.

---

## 10. Smart Views & Dynamic Filters

- **Quick Reads**: Automatically aggregates articles with reading times under 6 minutes.
- **Deep Dives**: Isolates long-form technical papers and architecture write-ups with reading times over 8 minutes.
- **Key Highlights**: Surfaces documents containing multiple highlights and annotations.
- **Starred Research**: Fast access to favorite papers and bookmarks.

---

## 11. PDF Research Paper & Companion Extension Support

- **PDF Ingestion**: Drag and drop multi-page PDF papers. The extraction pipeline leverages `pdfjs-dist` to pull clean text and metadata into the SQLite FTS5 index.
- **Manifest V3 Extension**: Companion extension allows one-click clipping of active tabs directly into Omnivault via `Alt+S` shortcut.
- **Zen Mode**: Press `z` in reader view to hide all sidebars and toolbars for focused reading.
- **Hands-Free Auto-Scroll**: Press `Shift+Space` to trigger smooth automatic scrolling with an interactive speed HUD.
