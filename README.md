<p align="center">
  <img src="docs/images/omnivault_logo.svg" alt="Omnivault Logo" width="128" height="128" />
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

<p align="center">
  <img src="docs/images/omnivault-3.png" alt="On-Device Text-to-Speech Audio Player" width="100%" />
</p>

### 4. Bidirectional Sync & PKM Export
- **Obsidian Vault Export**: Generates a structured ZIP archive containing individual Markdown files with YAML frontmatter (`title`, `source`, `author`, `tags`, `omnivault_id`) and formatted callout blocks (`> [!quote]` and `> [!note]`).
- **Logseq Package**: Exports hierarchically nested outliner bullets ready for Logseq graph directories.
- **Full JSON Backup & Restore**: Creates atomic backups of articles, highlights, and RSS feeds.
- **Omnivore Migration**: Directly imports JSON export files from Omnivore and Wallabag.

<p align="center">
  <img src="docs/images/omnivault-4.png" alt="Sync and Export Modal" width="100%" />
</p>

### 5. Multi-Source Web Clipper & EPUB Reader
- URL Web Clipper: multi-proxy failover pipeline scrapes clean article text from remote sites.
- EPUB parser: drag and drop `.epub` digital books directly into your vault for offline reading.
- 1-Click Bookmarklet: drag the provided JavaScript bookmarklet to your browser toolbar to clip any page with a click.
- RSS & Atom Feed Reader: subscribe to tech blogs and publications, preview summaries, and save items to your vault.

### 6. Reading Analytics & Custom Typography
- 5 reading color themes: Paper, Sepia, Charcoal, Nord, and OLED Black.
- Configurable typography: Serif (Georgia), Sans-Serif (System), Monospace (JetBrains Mono), with line height and margin width sliders.
- Bionic reading mode guides natural eye tracking.
- Visual analytics modal tracks total words read, reading speed, time spent, tag distributions, and active streaks.

<p align="center">
  <img src="docs/images/omnivault-5.png" alt="Reading Analytics and Health Modal" width="100%" />
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
