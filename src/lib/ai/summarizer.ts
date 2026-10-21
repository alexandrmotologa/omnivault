// 100% Offline Extractive Summarizer & Concept Extractor (Zero-Cloud)

const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'could', 'did',
  'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have',
  'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into',
  'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of',
  'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves',
  'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very',
  'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you',
  'your', 'yours', 'yourself', 'yourselves', 'will', 'can', 'also', 'one', 'two', 'like'
]);

export interface OfflineSummaryResult {
  takeaways: string[];
  keywords: string[];
  difficulty: 'Accessible' | 'Intermediate' | 'Deep Technical';
  readingTimeMinutes: number;
}

export function extractOfflineSummary(textOrMarkdown: string, maxBullets = 4): OfflineSummaryResult {
  // 1. Clean markdown formatting
  const plainText = textOrMarkdown
    .replace(/```[\s\S]*?```/g, '') // remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // clean links
    .replace(/[#*`_~>]/g, ' ') // clean markdown chars
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Split into sentences
  const rawSentences = plainText
    .split(/(?<=[.?!])\s+(?=[A-Z0-9"'])/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 25 && s.length <= 280 && !s.startsWith('http'));

  if (rawSentences.length <= maxBullets) {
    return {
      takeaways: rawSentences.slice(0, maxBullets),
      keywords: ['Research', 'Overview'],
      difficulty: 'Accessible',
      readingTimeMinutes: Math.max(1, Math.round(plainText.split(/\s+/).length / 200)),
    };
  }

  // 3. Compute word frequencies
  const words = plainText.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const wordFreq = new Map<string, number>();

  for (const w of words) {
    if (!STOPWORDS.has(w)) {
      wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
    }
  }

  // Extract top 6 keywords
  const sortedKeywords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));

  // 4. Score sentences based on:
  // - Keyword density
  // - Position in text (early sentences usually present the core thesis)
  // - Indicator terms ('propose', 'conclude', 'demonstrates', 'fundamental', 'essential', 'architecture', 'problem')
  const indicatorRegex = /\b(propose|believe|conclude|demonstrates|fundamental|essential|architecture|problem|solution|results|shows|discovered|reveals)\b/i;

  const scoredSentences = rawSentences.map((sentence, idx) => {
    const sWords = sentence.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    let score = 0;

    for (const sw of sWords) {
      score += wordFreq.get(sw) || 0;
    }

    // Normalize by length so long sentences don't unfairly dominate
    if (sWords.length > 0) {
      score = score / Math.sqrt(sWords.length);
    }

    // Positional weight: first 20% of sentences get a boost
    if (idx < rawSentences.length * 0.25) {
      score *= 1.35;
    }

    // Indicator keyword boost
    if (indicatorRegex.test(sentence)) {
      score *= 1.25;
    }

    return { sentence, score, index: idx };
  });

  // Pick top N highest scoring sentences
  scoredSentences.sort((a, b) => b.score - a.score);
  const selected = scoredSentences.slice(0, maxBullets);

  // Re-order by appearance in the original article for logical flow
  selected.sort((a, b) => a.index - b.index);

  // 5. Reading difficulty estimate
  const avgWordsPerSentence = words.length / Math.max(1, rawSentences.length);
  let difficulty: 'Accessible' | 'Intermediate' | 'Deep Technical' = 'Accessible';
  if (avgWordsPerSentence > 22 || words.some((w) => w.length > 11)) {
    difficulty = 'Deep Technical';
  } else if (avgWordsPerSentence > 15) {
    difficulty = 'Intermediate';
  }

  return {
    takeaways: selected.map((s) => s.sentence),
    keywords: sortedKeywords,
    difficulty,
    readingTimeMinutes: Math.max(1, Math.round(words.length / 200)),
  };
}
