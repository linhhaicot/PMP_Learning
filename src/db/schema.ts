import Dexie, { type Table } from 'dexie'
import type { Grade, Reading, VocabCard } from '../types'

/**
 * IndexedDB (via Dexie) is the single source of truth for the whole app:
 * learning *content* (vocabulary, readings) AND the learner's own state (SRS
 * progress, attempts, daily activity).
 *
 * Content lives here because the user imports their own Markdown (see
 * import/parseMarkdown + db/importContent). The JSON in /public/data is only
 * demo seed data, loaded into the `vocab`/`readings` tables once on first run
 * (see db/seed) — after that, Dexie is authoritative and the app reads content
 * reactively via useLiveQuery.
 */

/** Per-card spaced-repetition state. `cardId` is the primary key. */
export interface CardProgress {
  cardId: string
  easiness: number
  interval: number
  repetitions: number
  /** Epoch ms; a card is "due" when dueDate <= Date.now(). */
  dueDate: number
  lastReviewed: number
}

/** A single graded answer, from either a flashcard, quiz or reading question. */
export interface ReviewLog {
  id?: number
  cardId: string
  kind: 'flashcard' | 'quiz' | 'reading'
  grade?: Grade
  correct?: boolean
  reviewedAt: number
}

/** One row per calendar day the learner was active — powers streaks & charts. */
export interface DailyStat {
  /** ISO date, e.g. "2026-11-16" — primary key. */
  date: string
  reviewed: number
  correct: number
}

export class PmpDatabase extends Dexie {
  vocab!: Table<VocabCard, string>
  readings!: Table<Reading, string>
  progress!: Table<CardProgress, string>
  reviews!: Table<ReviewLog, number>
  daily!: Table<DailyStat, string>

  constructor() {
    super('pmp-learning')
    this.version(1).stores({
      progress: 'cardId, dueDate',
      reviews: '++id, cardId, kind, reviewedAt',
      daily: 'date',
    })
    // v2: content moves into IndexedDB so the user can import their own.
    this.version(2).stores({
      vocab: 'id, domain',
      readings: 'id',
    })
  }
}

export const db = new PmpDatabase()
