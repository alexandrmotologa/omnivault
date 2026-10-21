<p align="center">
  <img src="docs/images/logo.png?raw=true" alt="Omnivault Logo" width="130" style="border-radius: 24px;" />
</p>

<h1 align="center">Omnivault</h1>

<p align="center">
  <strong>Local-first research vault and read-it-later PWA with SQLite FTS5, web clipping, text highlights, margin notes, and on-device speech.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/react-19-blue.svg" alt="React 19" />
  <img src="https://img.shields.io/badge/sqlite-fts5-003B57.svg" alt="SQLite FTS5" />
  <img src="https://img.shields.io/badge/storage-OPFS%20%2F%20IDB-emerald.svg" alt="Storage OPFS" />
  <img src="https://img.shields.io/badge/export-Obsidian%20%2F%20Logseq-purple.svg" alt="Obsidian Export" />
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="MIT License" />
</p>

---

## Overview

The shutdown of Omnivore in 2024 left developers and researchers without a private, free read-it-later tool. Most hosted alternatives require monthly subscriptions and lock reading archives inside remote databases.

Omnivault is a self-contained progressive web application that stores your entire reading archive on your own device. It runs an official SQLite engine compiled to WebAssembly with native FTS5 full-text indexing, saves data into the browser Origin Private File System (OPFS) and IndexedDB, strips ads with Mozilla Readability, and converts web articles into clean Markdown.

You can highlight text in five colors, record margin notes, listen to saved articles as podcasts using browser text-to-speech, and export your entire archive into Obsidian or Logseq with one click.

---

## Product Tour

<p align="center">
  <img src="docs/images/omnivault_demo.gif" alt="Omnivault Interactive Walkthrough" width="100%" />
</p>

<p align="center"><em>Interactive walkthrough: SQLite FTS5 search, reading mode, margin notes drawer, and on-device speech.</em></p>

---

## Key Capabilities

### 1. SQLite FTS5 Full-Text Search
- Embedded `@sqlite.org/sqlite-wasm` engine running locally in browser memory with OPFS file system persistence.
- FTS5 virtual tables with Porter stemmer tokenization (`tokenize = 'porter unicode61'`).
- Sub-millisecond queries across thousands of saved articles using BM25 relevance ranking.
- Contextual search hit snippets highlighting matched keywords in real time.

<p align="center">
  <img src="docs/images/omnivault-1.png" alt="Omnivault Main Vault View" width="100%" />
</p>

### 2. Distraction-Free Reader & Multi-Color Highlighter
- Mozilla Readability parser cleans out banner ads, tracking scripts, and paywall clutter.
- Floating annotation toolbar appears on text selection: choose between Amber, Emerald, Sky, Purple, and Rose highlighters.
- Add rich margin notes and commentary attached to specific text passages.
- Slide-over Margin Notes drawer lets you jump between highlights, edit notes, filter by color, and copy Markdown quotes.

<p align="center">
  <img src="docs/images/omnivault-2.png" alt="Reader View with Margin Notes Drawer" width="100%" />
</p>

### 3. On-Device Text-to-Speech Podcast Engine
- Uses the standard Web Speech API without external cloud voice fees.
- Splits articles into natural paragraph units with synchronized karaoke highlighting.
- Floating playback dock lets you adjust reading speed from 0.75x to 2.0x, skip paragraphs, and pick from installed system neural voices.

### 4. Bidirectional Sync & PKM Export
- **Obsidian Vault Export**: Generates a structured ZIP archive containing individual Markdown files with YAML frontmatter (`title`, `source`, `author`, `tags`, `omnivault_id`) and formatted callout blocks (`> [!quote]` and `> [!note]`).
- **Logseq Package**: Exports hierarchically nested outliner bullets ready for Logseq graph directories.
- **Full JSON Backup & Restore**: Creates atomic backups of articles, highlights, and RSS feeds.
- **Omnivore Migration**: Directly imports JSON export files from Omnivore and Wallabag.

### 5. Spaced Repetition & Daily Review (SRS)
- Automated flashcard generation derived from your color-coded highlights and margin notes.
- Leitner SM-2 scheduling algorithm with dynamic intervals (Again 1d, Hard 3d, Good 7d, Easy 14d).
- 3D flip card review modal with hotkey navigation (Space to flip, 1 to 4 to grade) and streak tracking.

<p align="center">
  <img src="docs/images/omnivault-4.png" alt="Spaced Repetition Daily Review Modal" width="100%" />
</p>

### 6. Interactive Knowledge Graph
- HTML5 Canvas 2D force-directed physics simulation mapping relationships between documents, tags, and domains.
- Real-time zoom, pan, node dragging, keyword search filtering, and click-to-read navigation.

<p align="center">
  <img src="docs/images/omnivault-3.png" alt="Interactive Knowledge Graph View" width="100%" />
</p>

### 7. Offline TextRank Summarizer & Bring-Your-Own-Key AI
- 100% offline graph-based TextRank algorithm extracts core takeaways, reading ease levels, and keyword clusters.
- Optional Bring-Your-Own-Key (BYOK) assistant supporting local Ollama (`localhost:11434`) and OpenAI-compatible endpoints for contextual Q&A.

### 8. Smart Views & Dynamic Navigation
- Automated filters for Quick Reads (under 5 minutes), Deep Dives (over 8 minutes), Key Highlights (annotated papers), and Starred Research.

### 9. Zen Mode & Hands-Free Auto-Scroll
- Focused reading view toggled with `z` hides all navigation chrome for distraction-free study.
- Hands-free auto-scroll engine toggled with `Shift+Space` with floating speed regulator (15 to 120 px/s).

### 10. Multi-Format Ingestion: Web, PDF, EPUB & RSS
- URL Web Clipper: multi-proxy failover pipeline scrapes clean article text from remote sites.
- PDF Paper Parser: drag and drop research papers for automatic text and metadata extraction via `pdfjs-dist`.
- EPUB reader: drag and drop digital books directly into your vault for offline reading.
- Manifest V3 Extension: browser companion extension with `Alt+S` shortcut to clip articles directly into local storage.
- RSS and Atom Feed Reader: subscribe to tech blogs and publications with one-click vault import.

### 11. Responsive Architecture & Adaptive Mobile Design
- Optimized for desktop (1440px+), tablet (768px), and mobile (390px) form factors.
- Slide-over mobile drawer for one-handed navigation through reading inboxes, smart views, and tags.
- Touch-friendly card actions, responsive typography controls, and full-screen Zen mode.

<p align="center">
  <img src="docs/images/omnivault-5.png" alt="Omnivault Mobile Responsive View" width="400" />
</p>

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                      Omnivault Client                       │
├─────────────────────────────────────────────────────────────┤
│  React 19 + TypeScript + Tailwind CSS UI Layer              │
│  ├── Reader Engine & Margin Notes Drawer                    │
│  ├── Web Speech Synthesis Controller                        │
│  └── Search & Navigation Filtering                          │
├─────────────────────────────────────────────────────────────┤
│  Article Ingestion & Transformation Pipeline                │
│  ├── Multi-proxy CORS fetcher                               │
│  ├── Mozilla Readability DOM Parser                         │
│  ├── DOMPurify HTML Sanitizer                               │
│  ├── Turndown Markdown Generator                            │
│  └── EPUB Unzipper & Spine Extractor                        │
├─────────────────────────────────────────────────────────────┤
│  Storage & Indexing Engine                                  │
│  ├── SQLite Wasm 3.54 (WebAssembly module)                  │
│  ├── Virtual FTS5 table with Porter stemmer                 │
│  ├── OPFS (Origin Private File System) primary storage      │
│  └── IndexedDB serialized binary fallback                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `/` | Focus SQLite FTS5 search input |
| `j` / `k` | Next / previous article or scroll down / up |
| `h` | Highlight selected text in reader |
| `z` | Toggle Zen Mode (hide distractions and focus on prose) |
| `Shift+Space` | Toggle hands-free auto-scroll teleprompter |
| `e` or `a` | Archive current article |
| `s` | Toggle star / favorite |
| `t` | Play / Pause text-to-speech podcast |
| `d` | Move article to trash |
| `Esc` | Close open modals or exit reader view |
| `?` | Open keyboard shortcuts cheat sheet |

---

## Getting Started

### Prerequisites
- Node.js 20 or higher
- npm 10 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/alexandrmotologa/omnivault.git
cd omnivault

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Building for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

The output bundle is located in `dist/` and can be hosted on GitHub Pages, Cloudflare Pages, Vercel, or any static web host.

---

## Documentation

- [System Architecture](docs/ARCHITECTURE.md)
- [Feature Specifications](docs/FEATURES.md)
- [Web Clipper & Bookmarklet Guide](docs/CLI_CLIPPER.md)

---

## License

Omnivault is released under the [MIT License](LICENSE).
