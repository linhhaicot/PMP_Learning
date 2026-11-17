import { db, type CardProgress } from './schema'
import { schedule, INITIAL_SRS, type SrsState } from '../srs/sm2'
import { orderStudyCards } from '../srs/queue'
import type { Grade, VocabCard } from '../types'

/**
 * Mutations that record learner activity. Every graded interaction funnels
 * through here so SRS state, the review log and the daily stat stay consistent
 * — they are written together inside one Dexie transaction.
 */

function isoDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10)
}

/** Grade a flashcard: advance its SRS schedule and log the review. */
export async function gradeFlashcard(
  cardId: string,
  grade: Grade,
  now: number = Date.now(),
): Promise<void> {
  await db.transaction('rw', db.progress, db.reviews, db.daily, async () => {
    const existing = await db.progress.get(cardId)
    const prev: SrsState = existing ?? INITIAL_SRS
    const next = schedule(prev, grade, now)

    await db.progress.put({
      cardId,
      easiness: next.easiness,
      interval: next.interval,
      repetitions: next.repetitions,
      dueDate: next.dueDate,
      lastReviewed: now,
    })
    await db.reviews.add({ cardId, kind: 'flashcard', grade, reviewedAt: now })
    await bumpDaily(isoDay(now), grade !== 'again')
  })
}

/** Log a quiz/reading answer (no SRS scheduling — these are one-shot checks). */
export async function logAnswer(
  cardId: string,
  kind: 'quiz' | 'reading',
  correct: boolean,
  now: number = Date.now(),
): Promise<void> {
  await db.transaction('rw', db.reviews, db.daily, async () => {
    await db.reviews.add({ cardId, kind, correct, reviewedAt: now })
    await bumpDaily(isoDay(now), correct)
  })
}

async function bumpDaily(date: string, correct: boolean): Promise<void> {
  const row = (await db.daily.get(date)) ?? { date, reviewed: 0, correct: 0 }
  row.reviewed += 1
  if (correct) row.correct += 1
  await db.daily.put(row)
}

/**
 * Build an ordered flashcard study queue: due cards first, sorted by priority
 * (high → low) then by SRS urgency. See srs/queue for the pure ordering rules.
 */
export async function buildStudyQueue(
  cards: VocabCard[],
  now: number = Date.now(),
): Promise<VocabCard[]> {
  const progress = await db.progress
    .where('cardId')
    .anyOf(cards.map((c) => c.id))
    .toArray()
  const byId = new Map<string, CardProgress>(progress.map((p) => [p.cardId, p]))
  return orderStudyCards(cards, byId, now)
}
