import * as pdfjsLib from 'pdfjs-dist';
import { extractArticleFromHtml, ExtractedArticle } from './extract';

// Configure pdfjs worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export async function parsePdfFile(file: File): Promise<ExtractedArticle> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;

  const numPages = pdfDoc.numPages;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageString = textContent.items
      .map((item: any) => item.str || '')
      .join(' ')
      .replace(/\s+/g, ' ');

    if (pageString.trim()) {
      pageTexts.push(`<h3>Page ${pageNum}</h3>\n<p>${pageString}</p>`);
    }
  }

  // Attempt to extract PDF metadata
  let title = file.name.replace(/\.pdf$/i, '');
  let author = '';

  try {
    const meta = await pdfDoc.getMetadata();
    const info = (meta?.info as any) || {};
    if (info.Title) title = info.Title;
    if (info.Author) author = info.Author;
  } catch (e) {
    console.warn('Could not read PDF metadata:', e);
  }

  const combinedHtml = `<h2>${title}</h2>\n` + pageTexts.join('\n<hr />\n');
  const extracted = extractArticleFromHtml(combinedHtml);

  return {
    ...extracted,
    title,
    byline: author || extracted.byline,
    site_name: 'PDF Paper',
  };
}
