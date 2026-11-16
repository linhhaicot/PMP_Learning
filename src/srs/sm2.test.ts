import { describe, it, expect } from 'vitest'
import { schedule, INITIAL_SRS } from './sm2'

const NOW = 1_700_000_000_000
const DAY = 24 * 60 * 60 * 1000

describe('sm2 schedule', () => {
  it('first successful review is due in 1 day', () => {
    const r = schedule(INITIAL_SRS, 'good', NOW)
    expect(r.repetitions).toBe(1)
    expect(r.interval).toBe(1)
    expect(r.dueDate).toBe(NOW + DAY)
  })

  it('second successful review jumps to 6 days', () => {
    const first = schedule(INITIAL_SRS, 'good', NOW)
    const second = schedule(first, 'good', NOW)
    expect(second.interval).toBe(6)
  })

  it('"again" resets repetitions and lowers easiness', () => {
    const grown = schedule(schedule(INITIAL_SRS, 'easy', NOW), 'easy', NOW)
    const lapsed = schedule(grown, 'again', NOW)
    expect(lapsed.repetitions).toBe(0)
    expect(lapsed.interval).toBe(1)
    expect(lapsed.easiness).toBeLessThan(grown.easiness)
  })

  it('never lets easiness fall below 1.3', () => {
    let s = INITIAL_SRS
    for (let i = 0; i < 20; i++) s = schedule(s, 'again', NOW)
    expect(s.easiness).toBeGreaterThanOrEqual(1.3)
  })
})
