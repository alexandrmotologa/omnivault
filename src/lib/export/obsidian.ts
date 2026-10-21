import JSZip from 'jszip';
import { Article, Highlight } from '../db/types';

function sanitizeFilename(title: string): string {
  return title
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

export function generateObsidianMarkdown(article: Article, highlights: Highlight[]): string {
  const frontmatter = [
    '---',
    `title: "${article.title.replace(/"/g, '\\"')}"`,
    `source: "${article.url}"`,
    `author: "${article.byline.replace(/"/g, '\\"')}"`,
    `site: "${article.site_name.replace(/"/g, '\\"')}"`,
    `saved_date: ${article.saved_at.split('T')[0]}`,
    `status: ${article.status}`,
    `tags: [${article.tags.map((t) => `"${t}"`).join(', ')}]`,
    `omnivault_id: "${article.id}"`,
    '---',
    '',
  ].join('\n');

  let markdown = frontmatter;
  markdown += `# ${article.title}\n\n`;

  if (article.byline) {
    markdown += `**Author:** ${article.byline}  \n`;
  }
  if (article.url) {
    markdown += `**Source:** [${article.site_name || article.url}](${article.url})  \n`;
  }
  markdown += `**Saved:** ${new Date(article.saved_at).toLocaleDateString()} | **Reading Time:** ~${article.reading_time_minutes} min\n\n`;

  // Highlights section
  const articleHighlights = highlights.filter((h) => h.article_id === article.id);
  if (articleHighlights.length > 0) {
    markdown += `## Highlights & Margin Notes (${articleHighlights.length})\n\n`;
    for (const hl of articleHighlights) {
      markdown += `> [!quote] ${hl.color.toUpperCase()} HIGHLIGHT\n`;
      markdown += `> ${hl.text.replace(/\n/g, '\n> ')}\n`;
      if (hl.note) {
        markdown += `>\n> **Note:** ${hl.note.replace(/\n/g, '\n> ')}\n`;
      }
      markdown += `\n`;
    }
    markdown += `---\n\n`;
  }

  markdown += `## Article Content\n\n`;
  markdown += article.content_markdown;

  return markdown;
}

export async function exportVaultToObsidianZip(
  articles: Article[],
  highlights: Highlight[]
): Promise<Blob> {
  const zip = new JSZip();

  // Root folder structure
  const articlesFolder = zip.folder('Articles');
  const highlightsIndex: string[] = ['# Omnivault Research Digest\n\n'];

  for (const article of articles) {
    const filename = `${sanitizeFilename(article.title)}.md`;
    const content = generateObsidianMarkdown(article, highlights);
    articlesFolder?.file(filename, content);

    const artHls = highlights.filter((h) => h.article_id === article.id);
    if (artHls.length > 0) {
      highlightsIndex.push(`### [[Articles/${filename.replace(/\.md$/, '')}|${article.title}]]\n`);
      for (const h of artHls) {
        highlightsIndex.push(`- > "${h.text}"\n  ${h.note ? `*Note: ${h.note}*` : ''}\n`);
      }
      highlightsIndex.push('\n');
    }
  }

  zip.file('Omnivault Highlights Index.md', highlightsIndex.join('\n'));
  return await zip.generateAsync({ type: 'blob' });
}
