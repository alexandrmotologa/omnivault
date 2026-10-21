import JSZip from 'jszip';
import { extractArticleFromHtml, ExtractedArticle } from './extract';

export async function parseEpubFile(file: File): Promise<ExtractedArticle> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Find root OPF file path in META-INF/container.xml
  const containerXml = await zip.file('META-INF/container.xml')?.async('text');
  if (!containerXml) {
    throw new Error('Invalid EPUB file: missing META-INF/container.xml');
  }

  const parser = new DOMParser();
  const containerDoc = parser.parseFromString(containerXml, 'application/xml');
  const rootfile = containerDoc.querySelector('rootfile');
  const opfPath = rootfile?.getAttribute('full-path');

  if (!opfPath) {
    throw new Error('Invalid EPUB: could not find OPF package path.');
  }

  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  // 2. Read OPF file
  const opfText = await zip.file(opfPath)?.async('text');
  if (!opfText) {
    throw new Error('Missing OPF package in EPUB.');
  }

  const opfDoc = parser.parseFromString(opfText, 'application/xml');
  const title = opfDoc.querySelector('title')?.textContent || file.name.replace(/\.epub$/i, '');
  const creator = opfDoc.querySelector('creator')?.textContent || 'Unknown Author';
  const description = opfDoc.querySelector('description')?.textContent || '';

  // 3. Parse manifest
  const manifestItems = new Map<string, string>();
  opfDoc.querySelectorAll('manifest > item').forEach((item) => {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    if (id && href) {
      manifestItems.set(id, opfDir + href);
    }
  });

  // 4. Parse spine
  const itemrefs = opfDoc.querySelectorAll('spine > itemref');
  const chapterHrefs: string[] = [];
  itemrefs.forEach((ref) => {
    const idref = ref.getAttribute('idref');
    if (idref && manifestItems.has(idref)) {
      chapterHrefs.push(manifestItems.get(idref)!);
    }
  });

  // 5. Extract chapters content
  const combinedHtmlParts: string[] = [];

  for (const href of chapterHrefs) {
    // Some hrefs might have URL encodings
    const decodedHref = decodeURIComponent(href);
    const chapterFile = zip.file(decodedHref) || zip.file(href);
    if (chapterFile) {
      const htmlText = await chapterFile.async('text');
      const chapterDoc = parser.parseFromString(htmlText, 'text/html');
      // Remove scripts, styles
      chapterDoc.querySelectorAll('script, style, link').forEach((el) => el.remove());
      const bodyHtml = chapterDoc.body?.innerHTML || '';
      if (bodyHtml.trim()) {
        combinedHtmlParts.push(bodyHtml);
      }
    }
  }

  const fullHtml = combinedHtmlParts.join('\n<hr class="epub-chapter-divider" />\n');
  const extracted = extractArticleFromHtml(fullHtml);

  return {
    ...extracted,
    title: title || extracted.title,
    byline: creator || extracted.byline,
    excerpt: description || extracted.excerpt,
    site_name: 'EPUB Book',
  };
}
