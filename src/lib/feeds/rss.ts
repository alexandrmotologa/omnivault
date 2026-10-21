export interface FeedItem {
  id: string;
  title: string;
  link: string;
  author: string;
  pubDate: string;
  summary: string;
  content: string;
}

export interface ParsedFeed {
  title: string;
  link: string;
  description: string;
  items: FeedItem[];
}

export async function fetchAndParseFeed(feedUrl: string): Promise<ParsedFeed> {
  const url = feedUrl.trim();
  const proxyUrls = [
    url,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];

  let xmlText = '';
  let lastError: any = null;

  for (const pUrl of proxyUrls) {
    try {
      const res = await fetch(pUrl);
      if (res.ok) {
        xmlText = await res.text();
        if (xmlText.includes('<rss') || xmlText.includes('<feed') || xmlText.includes('<channel')) {
          break;
        }
      }
    } catch (e) {
      lastError = e;
    }
  }

  if (!xmlText) {
    throw new Error(`Failed to fetch RSS feed: ${lastError?.message || 'Network unreachable'}`);
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  // Check for parse error
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid RSS/Atom XML structure.');
  }

  // Detect Atom vs RSS 2.0
  const isAtom = xmlDoc.querySelector('feed') !== null;

  if (isAtom) {
    const feedTitle = xmlDoc.querySelector('feed > title')?.textContent || 'Untitled Feed';
    const feedLink = xmlDoc.querySelector('feed > link[rel="alternate"]')?.getAttribute('href') ||
                     xmlDoc.querySelector('feed > link')?.getAttribute('href') || url;
    const feedDesc = xmlDoc.querySelector('feed > subtitle')?.textContent || '';

    const entryNodes = xmlDoc.querySelectorAll('entry');
    const items: FeedItem[] = [];

    entryNodes.forEach((entry) => {
      const title = entry.querySelector('title')?.textContent || 'Untitled';
      const link = entry.querySelector('link[rel="alternate"]')?.getAttribute('href') ||
                   entry.querySelector('link')?.getAttribute('href') || '';
      const author = entry.querySelector('author > name')?.textContent || '';
      const pubDate = entry.querySelector('published, updated')?.textContent || new Date().toISOString();
      const content = entry.querySelector('content')?.textContent ||
                      entry.querySelector('summary')?.textContent || '';
      const summary = content.replace(/<[^>]+>/g, '').slice(0, 200);

      items.push({
        id: link || title,
        title,
        link,
        author,
        pubDate,
        summary,
        content,
      });
    });

    return {
      title: feedTitle,
      link: feedLink,
      description: feedDesc,
      items: items.slice(0, 30),
    };
  } else {
    // RSS 2.0
    const channel = xmlDoc.querySelector('channel');
    const feedTitle = channel?.querySelector('title')?.textContent || 'Untitled Feed';
    const feedLink = channel?.querySelector('link')?.textContent || url;
    const feedDesc = channel?.querySelector('description')?.textContent || '';

    const itemNodes = xmlDoc.querySelectorAll('item');
    const items: FeedItem[] = [];

    itemNodes.forEach((item) => {
      const title = item.querySelector('title')?.textContent || 'Untitled';
      const link = item.querySelector('link')?.textContent || '';
      const author = item.querySelector('dc\\:creator, creator, author')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();
      const content = item.querySelector('content\\:encoded, description')?.textContent || '';
      const summary = content.replace(/<[^>]+>/g, '').slice(0, 200);

      items.push({
        id: link || title,
        title,
        link,
        author,
        pubDate,
        summary,
        content,
      });
    });

    return {
      title: feedTitle,
      link: feedLink,
      description: feedDesc,
      items: items.slice(0, 30),
    };
  }
}

export function parseOpml(opmlText: string): { title: string; xmlUrl: string; htmlUrl: string }[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(opmlText, 'text/xml');
  const outlines = doc.querySelectorAll('outline[xmlUrl]');
  const feeds: { title: string; xmlUrl: string; htmlUrl: string }[] = [];

  outlines.forEach((el) => {
    const xmlUrl = el.getAttribute('xmlUrl');
    const title = el.getAttribute('title') || el.getAttribute('text') || 'Untitled Feed';
    const htmlUrl = el.getAttribute('htmlUrl') || '';
    if (xmlUrl) {
      feeds.push({ title, xmlUrl, htmlUrl });
    }
  });

  return feeds;
}
