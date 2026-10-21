import JSZip from 'jszip';
import { Article, Highlight } from '../db/types';

function sanitizeFilename(title: string): string {
  return title
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

export function generateLogseqMarkdown(article: Article, highlights: Highlight[]): string {
  const properties = [
    `title:: ${article.title}`,
    `url:: ${article.url}`,
    `author:: ${article.byline}`,
    `tags:: ${article.tags.map((t) => `[[${t}]]`).join(', ')}`,
    `status:: ${article.status}`,
    `type:: article`,
    `created-at:: ${article.saved_at}`,
    '',
  ].join('\n');

  let body = properties;
  body += `- # ${article.title}\n`;
  body += `  - Source: [${article.site_name || article.url}](${article.url})\n`;

  const articleHighlights = highlights.filter((h) => h.article_id === article.id);
  if (articleHighlights.length > 0) {
    body += `  - ## Highlights\n`;
    for (const hl of articleHighlights) {
      body += `    - > ${hl.text}\n`;
      if (hl.note) {
        body += `      - **Note:** ${hl.note}\n`;
      }
    }
  }

  body += `  - ## Full Content\n`;
  const paragraphs = article.content_markdown.split('\n\n');
  for (const p of paragraphs) {
    if (p.trim()) {
      body += `    - ${p.trim().replace(/\n/g, ' ')}\n`;
    }
  }

  return body;
}

export async function exportVaultToLogseqZip(
  articles: Article[],
  highlights: Highlight[]
): Promise<Blob> {
  const zip = new JSZip();
  const pagesFolder = zip.folder('pages');

  for (const article of articles) {
    const filename = `${sanitizeFilename(article.title)}.md`;
    const content = generateLogseqMarkdown(article, highlights);
    pagesFolder?.file(filename, content);
  }

  return await zip.generateAsync({ type: 'blob' });
}
