// Omnivault Web Clipper Popup Logic
document.addEventListener('DOMContentLoaded', async () => {
  const tabTitleEl = document.getElementById('tab-title');
  const tabDomainEl = document.getElementById('tab-domain');
  const tabReadingTimeEl = document.getElementById('tab-reading-time');
  const tagsInputEl = document.getElementById('tags-input');
  const btnClip = document.getElementById('btn-clip');
  const btnDownloadMd = document.getElementById('btn-download-md');
  const btnCopyJson = document.getElementById('btn-copy-json');
  const statusBanner = document.getElementById('status-banner');

  let extractedArticle = null;

  function showStatus(message, type = 'success') {
    statusBanner.textContent = message;
    statusBanner.className = `status-banner ${type}`;
    statusBanner.style.display = 'flex';
  }

  // Fetch current active tab and run extractor
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      tabTitleEl.textContent = 'Cannot access current tab.';
      return;
    }

    // Check for restricted schemes (chrome://, about:, edge://)
    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
      tabTitleEl.textContent = 'Cannot clip browser system pages.';
      btnClip.disabled = true;
      btnDownloadMd.disabled = true;
      btnCopyJson.disabled = true;
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });

    if (results && results[0] && results[0].result) {
      extractedArticle = results[0].result;
      tabTitleEl.textContent = extractedArticle.title;
      tabDomainEl.textContent = extractedArticle.domain;
      tabReadingTimeEl.textContent = `${extractedArticle.readingTimeMinutes} min read · ${extractedArticle.wordCount} words`;
    } else {
      tabTitleEl.textContent = tab.title || 'Untitled Webpage';
      tabDomainEl.textContent = new URL(tab.url).hostname;
      tabReadingTimeEl.textContent = 'Ready to clip';
      extractedArticle = {
        title: tab.title || 'Untitled Webpage',
        url: tab.url,
        domain: new URL(tab.url).hostname,
        contentHtml: '',
        plainText: '',
        wordCount: 0,
        readingTimeMinutes: 1,
        savedAt: new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error('Failed to extract article content:', err);
    tabTitleEl.textContent = 'Error reading page content';
    showStatus('Permission required or page protected', 'error');
  }

  function getTags() {
    const raw = tagsInputEl.value.trim();
    if (!raw) return [];
    return raw
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  }

  // 1-Click Clip action
  btnClip.addEventListener('click', async () => {
    if (!extractedArticle) return;

    btnClip.textContent = 'Clipping...';
    btnClip.disabled = true;

    try {
      const payload = {
        ...extractedArticle,
        tags: getTags(),
        status: 'inbox',
        favorite: 0,
      };

      // Store in Chrome storage for local queuing
      const storageKey = 'omnivault_queue';
      const existing = await chrome.storage.local.get([storageKey]);
      const queue = existing[storageKey] || [];
      queue.push(payload);
      await chrome.storage.local.set({ [storageKey]: queue });

      // Copy omnivault deep import URL or JSON to clipboard
      const jsonStr = JSON.stringify(payload);
      await navigator.clipboard.writeText(jsonStr);

      showStatus('Saved to queue and clipboard copied!');
      btnClip.textContent = 'Clipped to Omnivault';

      // If user holds Shift or clicks again, open Omnivault app tab
      setTimeout(() => {
        chrome.tabs.create({ url: 'http://localhost:5173' });
      }, 700);
    } catch (err) {
      console.error('Failed to clip article:', err);
      showStatus('Failed to clip article', 'error');
      btnClip.textContent = 'Clip to Omnivault';
      btnClip.disabled = false;
    }
  });

  // Download Markdown (.md)
  btnDownloadMd.addEventListener('click', () => {
    if (!extractedArticle) return;

    const tags = getTags();
    const yamlHeader = [
      '---',
      `title: "${extractedArticle.title.replace(/"/g, '\\"')}"`,
      `author: "${(extractedArticle.author || '').replace(/"/g, '\\"')}"`,
      `source: "${extractedArticle.url}"`,
      `domain: "${extractedArticle.domain}"`,
      `date: "${extractedArticle.savedAt}"`,
      `tags: [${tags.map((t) => `"${t}"`).join(', ')}]`,
      '---\n\n',
    ].join('\n');

    let body = extractedArticle.plainText || '';
    if (extractedArticle.selectedHighlight) {
      body = `> ${extractedArticle.selectedHighlight}\n\n---\n\n` + body;
    }

    const fullMd = yamlHeader + `# ${extractedArticle.title}\n\n` + body;
    const blob = new Blob([fullMd], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    const safeTitle = (extractedArticle.title || 'article')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);
    a.download = `${safeTitle}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showStatus('Markdown file downloaded!');
  });

  // Copy JSON action
  btnCopyJson.addEventListener('click', async () => {
    if (!extractedArticle) return;
    const payload = {
      ...extractedArticle,
      tags: getTags(),
    };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    showStatus('JSON copied to clipboard!');
  });
});
