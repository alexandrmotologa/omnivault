import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Modal } from '../common/Modal';
import {
  Sparkles,
  RotateCw,
  CheckCircle2,
  Brain,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { Flashcard } from '../../lib/db/types';
import { calculateNextReview, ReviewGrade } from '../../lib/srs/leitner';

interface DailyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashcards: Flashcard[];
  onRecordReview: (
    cardId: string,
    nextReviewAt: string,
    intervalDays: number,
    easeFactor: number,
    repetitions: number
  ) => Promise<void>;
  onOpenArticleById: (articleId: string) => void;
}

export const DailyReviewModal: React.FC<DailyReviewModalProps> = ({
  isOpen,
  onClose,
  flashcards,
  onRecordReview,
  onOpenArticleById,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [isSessionFinished, setIsSessionFinished] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsFlipped(false);
      setCompletedCount(0);
      setIsSessionFinished(false);
    }
  }, [isOpen]);

  const currentCard = flashcards[currentIndex];

  const handleGrade = async (grade: ReviewGrade) => {
    if (!currentCard) return;

    const result = calculateNextReview(currentCard, grade);
    await onRecordReview(
      currentCard.id,
      result.next_review_at,
      result.interval_days,
      result.ease_factor,
      result.repetitions
    );

    const nextIndex = currentIndex + 1;
    setCompletedCount((prev) => prev + 1);

    if (nextIndex < flashcards.length) {
      setCurrentIndex(nextIndex);
      setIsFlipped(false);
    } else {
      setIsSessionFinished(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  // Keyboard shortcut support: Space to flip, 1-4 to grade
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || isSessionFinished) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleGrade('again');
        if (e.key === '2') handleGrade('hard');
        if (e.key === '3') handleGrade('good');
        if (e.key === '4') handleGrade('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFlipped, isSessionFinished, currentCard]);

  const colorStyles: Record<string, string> = {
    yellow: 'border-l-4 border-amber-400',
    green: 'border-l-4 border-emerald-400',
    blue: 'border-l-4 border-blue-400',
    purple: 'border-l-4 border-purple-400',
    pink: 'border-l-4 border-rose-400',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Daily Review & Spaced Repetition" maxWidth="max-w-xl">
      <div className="space-y-4 text-xs">
        {!isSessionFinished && flashcards.length > 0 && (
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pb-2 border-b border-[var(--border-color)]">
            <span className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
              <Brain className="w-4 h-4 text-blue-500" />
              <span>Card {currentIndex + 1} of {flashcards.length}</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px]">Interval: {currentCard?.interval_days || 1}d</span>
              <span className="w-20 bg-[var(--bg-secondary)] h-1.5 rounded-full overflow-hidden">
                <span
                  className="bg-blue-600 h-full block transition-all"
                  style={{ width: `${Math.round(((currentIndex) / flashcards.length) * 100)}%` }}
                />
              </span>
            </div>
          </div>
        )}

        {isSessionFinished ? (
          /* Finished State */
          <div className="py-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto shadow-xs">
              <Flame className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-[var(--text-primary)]">
                Daily Review Complete!
              </h4>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                You reviewed {completedCount} flashcards today. Your knowledge retention intervals have been scheduled.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition-colors"
            >
              Back to Vault
            </button>
          </div>
        ) : flashcards.length === 0 ? (
          /* Empty Due Cards State */
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              All caught up for today!
            </h4>
            <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
              Highlight passages and add margin notes to any article to automatically generate memory flashcards.
            </p>
          </div>
        ) : (
          /* Active Flashcard */
          <div className="space-y-4">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={`p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-md hover:border-blue-500/40 cursor-pointer transition-all min-h-[220px] flex flex-col justify-between ${
                colorStyles[currentCard.color] || ''
              }`}
            >
              {/* Front of card (Highlight text) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span className="font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {isFlipped ? 'Answer & Margin Note' : 'Prompt / Quote'}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                    <RotateCw className="w-3 h-3" />
                    <span>Click or Space to flip</span>
                  </span>
                </div>

                {!isFlipped ? (
                  <blockquote className="text-sm sm:text-base font-serif italic text-[var(--text-primary)] leading-relaxed pt-2">
                    &ldquo;{currentCard.front}&rdquo;
                  </blockquote>
                ) : (
                  <div className="space-y-3 pt-2">
                    <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] leading-relaxed">
                      <span className="font-semibold block text-[11px] text-blue-500 mb-1">
                        Margin Note:
                      </span>
                      {currentCard.back}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] font-serif italic line-clamp-2">
                      Original: &ldquo;{currentCard.front}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Source Article footer */}
              <div className="pt-4 border-t border-[var(--border-color)]/60 flex items-center justify-between text-[11px]">
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenArticleById(currentCard.article_id);
                    onClose();
                  }}
                  className="text-[var(--text-muted)] hover:text-blue-500 transition-colors flex items-center gap-1 truncate max-w-[280px]"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{currentCard.article_title}</span>
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  Repetitions: {currentCard.repetitions}
                </span>
              </div>
            </div>

            {/* Action Grading Bar */}
            {isFlipped ? (
              <div className="space-y-2 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleGrade('again')}
                    className="p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-medium text-center transition-colors"
                  >
                    <div className="font-bold text-xs">Again (1)</div>
                    <div className="text-[10px] opacity-75">1 day</div>
                  </button>
                  <button
                    onClick={() => handleGrade('hard')}
                    className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium text-center transition-colors"
                  >
                    <div className="font-bold text-xs">Hard (2)</div>
                    <div className="text-[10px] opacity-75">3 days</div>
                  </button>
                  <button
                    onClick={() => handleGrade('good')}
                    className="p-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium text-center transition-colors"
                  >
                    <div className="font-bold text-xs">Good (3)</div>
                    <div className="text-[10px] opacity-75">7 days</div>
                  </button>
                  <button
                    onClick={() => handleGrade('easy')}
                    className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium text-center transition-colors"
                  >
                    <div className="font-bold text-xs">Easy (4)</div>
                    <div className="text-[10px] opacity-75">14 days</div>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsFlipped(true)}
                className="w-full py-2.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Show Answer (Space)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
