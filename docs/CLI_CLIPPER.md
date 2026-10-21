# Web Clipper & Bookmarklet Guide

Omnivault provides multiple zero-cloud methods to save articles from your browser.

## Option 1: Browser Bookmarklet (Recommended)

The easiest way to clip web pages from Chrome, Safari, Edge, or Firefox is with the Omnivault Bookmarklet.

### Installation

1. Make your browser bookmarks bar visible:
   - macOS: `Cmd + Shift + B`
   - Windows / Linux: `Ctrl + Shift + B`
2. Open Omnivault and click **1-Click Bookmarklet** in the sidebar.
3. Drag the blue **Clip to Omnivault** button onto your bookmarks bar.

### Usage

Whenever you are on a webpage you want to save:
1. Click the **Clip to Omnivault** bookmark in your browser toolbar.
2. A new tab opens with Omnivault, automatically prefilling the URL and triggering the extraction pipeline.
3. The clean article is parsed, indexed in SQLite FTS5, and ready for offline reading.

---

## Option 2: Direct URL Input

Inside Omnivault:
1. Click the **Clip Webpage** button in the top navigation bar.
2. Paste any target URL (e.g. `https://simonwillison.net/2024/Jan/15/sqlite-extensions/`).
3. Optionally add comma-separated tags (e.g. `sqlite, devtools`).
4. Click **Extract Clean Article**.

---

## Option 3: Raw HTML or Markdown Paste

For articles behind corporate logins, internal wikis, or paywalled newsletters:
1. Copy the text or HTML from the source page.
2. Open the **Paste Text / HTML** tab in the Clip modal.
3. Enter the title and paste the content.
4. Click **Save Article**.

---

## Option 4: EPUB Book Drop

1. Drag and drop any `.epub` digital book file directly onto the Omnivault window or select it via the file browser in the Clip modal.
2. Omnivault extracts all chapters, metadata, and reading order, saving the book as an indexed offline document.
