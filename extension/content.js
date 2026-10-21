// Omnivault Content Extractor Script
(function () {
  function extractArticleData() {
    const title =
      document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      document.querySelector('h1')?.innerText?.trim() ||
      document.title ||
      'Untitled Article';

    const author =
      document.querySelector('meta[name="author"]')?.getAttribute('content') ||
      document.querySelector('meta[property="article:author"]')?.getAttribute('content') ||
      document.querySelector('[rel="author"]')?.innerText?.trim() ||
      document.querySelector('.byline, .author')?.innerText?.trim() ||
      '';

    const excerpt =
      document.querySelector('meta[name="description"]')?.getAttribute('content') ||
      document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      '';

    const url =
      document.querySelector('link[rel="canonical"]')?.getAttribute('href') ||
      window.location.href;

    const hostname = window.location.hostname.replace(/^www\./, '');

    // Get any user highlighted text
    const selectedText = window.getSelection()?.toString()?.trim() || '';

    // Clone content root to avoid modifying live DOM
    const articleElem =
      document.querySelector('article') ||
      document.querySelector('[role="main"]') ||
      document.querySelector('main') ||
      document.querySelector('.post-content, .article-content, .entry-content') ||
      document.body;

    const clone = articleElem.cloneNode(true);

    // Strip unneeded tags
    const junkSelectors = [
      'script',
      'style',
      'noscript',
      'nav',
      'header',
      'footer',
      'iframe',
      'form',
      'button',
      'aside',
      '.ad',
      '.advertisement',
      '[class*="ad-"]',
      '[id*="ad-"]',
      '[class*="cookie"]',
      '[class*="modal"]',
      '[class*="popup"]',
      '[class*="banner"]',
      '.newsletter-signup',
      '.social-share',
    ];

    junkSelectors.forEach((sel) => {
      clone.querySelectorAll(sel).forEach((el) => el.remove());
    });

    const cleanHtml = clone.innerHTML.trim();
    const plainText = clone.innerText.trim();
    const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
    const readingTime = Math.max(1, Math.ceil(wordCount / 220));

    return {
      title,
      author,
      excerpt: excerpt.length > 280 ? excerpt.slice(0, 277) + '...' : excerpt,
      url,
      domain: hostname,
      contentHtml: cleanHtml,
      plainText,
      wordCount,
      readingTimeMinutes: readingTime,
      selectedHighlight: selectedText || null,
      savedAt: new Date().toISOString(),
    };
  }

  // Listen for message from popup
  if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'extract') {
        const data = extractArticleData();
        sendResponse(data);
      }
      return true;
    });
  }

  return extractArticleData();
})();
