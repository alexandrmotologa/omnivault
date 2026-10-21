import { extractArticleFromHtml, ExtractedArticle } from './extract';

export async function fetchAndExtractUrl(targetUrl: string): Promise<ExtractedArticle> {
  const url = targetUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error('Please enter a valid HTTP or HTTPS URL.');
  }

  // Multi-tier proxy fallback chain:
  // 1. Direct fetch (works for CORS-enabled sites)
  // 2. allorigins.win raw proxy
  // 3. corsproxy.io
  const fetchStrategies = [
    async () => {
      const res = await fetch(url, { headers: { 'Accept': 'text/html,application/xhtml+xml' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    },
    async () => {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`AllOrigins HTTP ${res.status}`);
      return await res.text();
    },
    async () => {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`CORSProxy HTTP ${res.status}`);
      return await res.text();
    },
  ];

  let rawHtml = '';
  let lastError: any = null;

  for (const strategy of fetchStrategies) {
    try {
      rawHtml = await strategy();
      if (rawHtml && rawHtml.length > 100) {
        break;
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!rawHtml) {
    throw new Error(
      `Could not fetch page. The site may block automated scraping. Error: ${lastError?.message || 'Network blocked'}`
    );
  }

  return extractArticleFromHtml(rawHtml, url);
}

export function generateBookmarkletCode(): string {
  // 1-Click Bookmarklet that can be dragged to bookmarks bar
  // Grabs the current page's HTML and sends it to the Omnivault window
  return `javascript:(function(){
    var url = window.location.href;
    var title = document.title;
    var html = document.documentElement.outerHTML;
    window.open('${window.location.origin}/?clip_url=' + encodeURIComponent(url) + '&clip_title=' + encodeURIComponent(title), '_blank');
  })();`.replace(/\s+/g, ' ');
}
