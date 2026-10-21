import { Flashcard, Highlight, Article } from '../db/types';

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

export function calculateNextReview(
  card: Flashcard,
  grade: ReviewGrade
): { next_review_at: string; interval_days: number; ease_factor: number; repetitions: number } {
  let ease = card.ease_factor;
  let interval = card.interval_days;
  let reps = card.repetitions;

  if (grade === 'again') {
    interval = 1;
    reps = 0;
    ease = Math.max(1.3, ease - 0.2);
  } else if (grade === 'hard') {
    interval = Math.max(1, Math.round(interval * 1.2));
    ease = Math.max(1.3, ease - 0.15);
    reps += 1;
  } else if (grade === 'good') {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 3;
    else interval = Math.round(interval * ease);
    reps += 1;
  } else if (grade === 'easy') {
    if (reps === 0) interval = 2;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ease * 1.3);
    ease = Math.min(3.0, ease + 0.15);
    reps += 1;
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  return {
    next_review_at: nextDate.toISOString(),
    interval_days: interval,
    ease_factor: ease,
    repetitions: reps,
  };
}

export function createFlashcardFromHighlight(highlight: Highlight, article: Article): Flashcard {
  return {
    id: 'fc-' + highlight.id,
    highlight_id: highlight.id,
    article_id: article.id,
    article_title: article.title,
    front: highlight.text,
    back: highlight.note || `Key concept from: "${article.title}"`,
    color: highlight.color,
    next_review_at: new Date().toISOString(),
    interval_days: 1,
    ease_factor: 2.5,
    repetitions: 0,
    last_reviewed_at: null,
  };
}
