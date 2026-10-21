import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';
import TurndownService from 'turndown';

export interface ExtractedArticle {
  title: string;
  byline: string;
  excerpt: string;
  content_html: string;
  content_markdown: string;
  site_name: string;
  published_at: string;
  reading_time_minutes: number;
  word_count: number;
}

const turndown = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
});

// Configure turndown to keep clean formatting for tables & pre blocks
turndown.addRule('preFormattedCode', {
  filter: ['pre'],
  replacement: (content, node) => {
    const codeEl = (node as HTMLElement).querySelector('code');
    const lang = codeEl?.className?.match(/language-(\w+)/)?.[1] || '';
    const codeText = codeEl ? codeEl.textContent : node.textContent;
    return `\n\`\`\`${lang}\n${(codeText || '').trim()}\n\`\`\`\n`;
  },
});

export function extractArticleFromHtml(rawHtml: string, sourceUrl = ''): ExtractedArticle {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // Try extracting Open Graph / Twitter metadata if available
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const ogSiteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
  const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                 doc.querySelector('meta[name="description"]')?.getAttribute('content');
  const ogAuthor = doc.querySelector('meta[name="author"]')?.getAttribute('content') ||
                   doc.querySelector('meta[property="article:author"]')?.getAttribute('content');
  const ogDate = doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
                 doc.querySelector('time')?.getAttribute('datetime');

  // Derive domain from URL if available
  let domain = '';
  try {
    if (sourceUrl) {
      domain = new URL(sourceUrl).hostname.replace(/^www\./, '');
    }
  } catch {
    // ignore
  }

  // Run Mozilla Readability
  const reader = new Readability(doc);
  const article = reader.parse();

  const title = article?.title || ogTitle || doc.title || 'Untitled Article';
  const byline = article?.byline || ogAuthor || '';
  const excerpt = article?.excerpt || ogDesc || '';
  const site_name = ogSiteName || domain || 'Web';

  // Sanitize extracted HTML
  const rawContent = article?.content || doc.body.innerHTML || '<p>No content extracted.</p>';
  const cleanHtml = DOMPurify.sanitize(rawContent, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'b', 'i', 'strong', 'em',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'img', 'table', 'thead',
      'tbody', 'tr', 'th', 'td', 'hr', 'figure', 'figcaption', 'span', 'br'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target'],
  });

  // Convert to clean Markdown
  const markdown = turndown.turndown(cleanHtml);

  // Word count and reading time
  const plainText = article?.textContent || doc.body.textContent || '';
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 225));

  return {
    title,
    byline,
    excerpt,
    content_html: cleanHtml,
    content_markdown: markdown,
    site_name,
    published_at: ogDate || new Date().toISOString(),
    reading_time_minutes: readingTime,
    word_count: wordCount,
  };
}
