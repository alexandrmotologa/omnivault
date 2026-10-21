import { Article, Highlight, SmartView } from '../db/types';

export const DEFAULT_SMART_VIEWS: SmartView[] = [
  {
    id: 'quick-reads',
    name: 'Quick Reads',
    iconName: 'Zap',
    description: 'Articles under 6 minutes read',
    filter: { maxReadingTime: 5 },
  },
  {
    id: 'deep-dives',
    name: 'Deep Dives',
    iconName: 'Compass',
    description: 'Long-form papers & articles (> 8 min)',
    filter: { minReadingTime: 8 },
  },
  {
    id: 'heavily-annotated',
    name: 'Key Highlights',
    iconName: 'Highlighter',
    description: 'Articles with multiple annotations',
    filter: { minHighlights: 2 },
  },
  {
    id: 'starred-research',
    name: 'Starred Research',
    iconName: 'Star',
    description: 'Favorite research documents',
    filter: { favorite: true },
  },
];

export function filterArticlesBySmartView(
  articles: Article[],
  highlights: Highlight[],
  smartView: SmartView
): Article[] {
  const highlightCounts = new Map<string, number>();
  for (const h of highlights) {
    highlightCounts.set(h.article_id, (highlightCounts.get(h.article_id) || 0) + 1);
  }

  return articles.filter((art) => {
    const f = smartView.filter;

    if (f.status && art.status !== f.status) return false;
    if (f.favorite !== undefined && (art.favorite === 1) !== f.favorite) return false;
    if (f.minReadingTime !== undefined && art.reading_time_minutes < f.minReadingTime) return false;
    if (f.maxReadingTime !== undefined && art.reading_time_minutes > f.maxReadingTime) return false;
    if (f.minHighlights !== undefined) {
      const count = highlightCounts.get(art.id) || 0;
      if (count < f.minHighlights) return false;
    }
    if (f.tag && !art.tags.includes(f.tag)) return false;

    return true;
  });
}
