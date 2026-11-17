import { describe, it, expect } from 'vitest'
import { orderStudyCards, type DueLookup } from './queue'
import type { VocabCard } from '../types'

const NOW = 1_000_000
const card = (id: string, priority?: VocabCard['priority']): VocabCard => ({
  id,
  term: id,
  definition: 'd',
  priority,
})

const lookup = (m: Record<string, number>): DueLookup => ({
  get: (id) => (id in m ? { dueDate: m[id] } : undefined),
})

describe('orderStudyCards', () => {
  it('orders high → medium/unset → low', () => {
    const cards = [card('a', 'low'), card('b', 'high'), card('c'), card('d', 'medium')]
    const out = orderStudyCards(cards, lookup({}), NOW).map((c) => c.id)
    expect(out[0]).toBe('b') // high
    expect(out[3]).toBe('a') // low last
    expect(out.slice(1, 3).sort()).toEqual(['c', 'd']) // medium/unset in the middle
  })

  it('breaks priority ties by most-overdue first', () => {
    const cards = [card('new', 'high'), card('old', 'high')]
    const out = orderStudyCards(
      cards,
      lookup({ new: NOW - 10, old: NOW - 100 }),
      NOW,
    ).map((c) => c.id)
    expect(out).toEqual(['old', 'new'])
  })

  it('studies only due cards when some are due', () => {
    const cards = [card('due'), card('later')]
    const out = orderStudyCards(
      cards,
      lookup({ due: NOW - 1, later: NOW + 100_000 }),
      NOW,
    ).map((c) => c.id)
    expect(out).toEqual(['due'])
  })

  it('falls back to the whole set when nothing is due', () => {
    const cards = [card('x', 'low'), card('y', 'high')]
    const out = orderStudyCards(
      cards,
      lookup({ x: NOW + 1000, y: NOW + 1000 }),
      NOW,
    ).map((c) => c.id)
    expect(out).toEqual(['y', 'x'])
  })
})
