import type { Grade } from '../types'

/**
 * Spaced-repetition scheduling based on the SM-2 algorithm (the one Anki/
 * SuperMemo derive from), adapted to a 4-button grading UI.
 *
 * The persisted state per card lives in the `progress` table (see db/schema).
 * This module is pure — no I/O — so it can be unit-tested in isolation and
 * reused anywhere a due date needs computing.
 */

export interface SrsState {
  /** Ease factor; starts at 2.5, floored at 1.3. */
  easiness: number
  /** Current inter-review interval in days. */
  interval: number
  /** Number of consecutive successful recalls. */
  repetitions: number
}

export const INITIAL_SRS: SrsState = {
  easiness: 2.5,
  interval: 0,
  repetitions: 0,
}

/** Map the 4-button UI grade to SM-2's 0–5 quality scale. */
const QUALITY: Record<Grade, number> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
}

const DAY_MS = 24 * 60 * 60 * 1000

export interface SrsResult extends SrsState {
  /** Epoch-ms timestamp when the card next becomes due. */
  dueDate: number
}

/**
 * Advance a card's SRS state given a grade and the current time.
 *
 * `now` is injected (not read from the clock) so scheduling is deterministic
 * and testable.
 */
export function schedule(prev: SrsState, grade: Grade, now: number): SrsResult {
  const q = QUALITY[grade]

  // A failed recall ("again") resets the learning progress but keeps easiness
  // decay, so lapsing cards don't lose their accumulated difficulty signal.
  if (q < 3) {
    return {
      easiness: clampEasiness(prev.easiness - 0.2),
      interval: 1,
      repetitions: 0,
      dueDate: now + 1 * DAY_MS,
    }
  }

  const easiness = clampEasiness(
    prev.easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  )
  const repetitions = prev.repetitions + 1

  let interval: number
  if (repetitions === 1) interval = 1
  else if (repetitions === 2) interval = 6
  else interval = Math.round(prev.interval * easiness)

  return {
    easiness,
    interval,
    repetitions,
    dueDate: now + interval * DAY_MS,
  }
}

function clampEasiness(ef: number): number {
  return Math.max(1.3, ef)
}
