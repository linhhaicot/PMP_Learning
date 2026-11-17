import type { Priority, VocabCard } from '../types'

/**
 * Pure flashcard-ordering logic (no I/O, so it is unit-tested directly).
 *
 * Two-level ordering for a study session:
 *  1. Priority — `high` first, then `medium`/unset, then `low` ("lướt"). The
 *     learner marks which terms are core to PMP thinking via the import.
 *  2. Within a priority, the most-overdue card first (smallest dueDate), so
 *     spaced-repetition urgency still breaks ties.
 *
 * Cards that are due (or never reviewed) are studied first; only if nothing is
 * due does the whole set become the pool (a free review round).
 */

const RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

export interface DueLookup {
  get(id: string): { dueDate: number } | undefined
}

export function orderStudyCards(
  cards: VocabCard[],
  progress: DueLookup,
  now: number,
): VocabCard[] {
  const isDue = (c: VocabCard) => {
    const p = progress.get(c.id)
    return !p || p.dueDate <= now
  }
  const due = cards.filter(isDue)
  const pool = due.length ? due : cards

  return [...pool].sort((a, b) => {
    const ra = RANK[a.priority ?? 'medium']
    const rb = RANK[b.priority ?? 'medium']
    if (ra !== rb) return ra - rb
    const da = progress.get(a.id)?.dueDate ?? 0
    const db = progress.get(b.id)?.dueDate ?? 0
    return da - db
  })
}
