# Omnivault Companion Web Extension

Manifest V3 browser extension for 1-click clipping of online articles, research papers, and documentation into the local Omnivault research vault.

## Capabilities

- Extracts article titles, authors, domains, clean text, and read time.
- Preserves on-page highlighted text selections when clipping.
- Exports directly to clean Markdown (.md) with YAML frontmatter.
- Queues articles to Chrome local storage and copies JSON payloads for instant vault ingestion.
- Quick keyboard shortcut: `Alt+S` (Windows/Linux/Mac).

## Installation

### Google Chrome, Brave, Arc, Microsoft Edge (Chromium)

1. Open `chrome://extensions` in your browser.
2. Enable **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the `omnivault/extension` directory from your cloned repository.
5. Pin the Omnivault icon to your extension bar for quick access.

### Mozilla Firefox

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Click **Load Temporary Add-on...**.
3. Select `extension/manifest.json`.

## Usage

1. Navigate to any article, technical blog, or paper.
2. Optional: highlight text on the page with your mouse cursor.
3. Press `Alt+S` or click the Omnivault toolbar icon.
4. Add tags separated by commas.
5. Click **Clip to Omnivault** or **Save Markdown**.
