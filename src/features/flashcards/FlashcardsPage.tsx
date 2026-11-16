import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import type { Grade } from '../../types'
import { db } from '../../db/schema'
import { dueCardIds, gradeFlashcard } from '../../db/reviews'

const GRADES: { grade: Grade; label: string; className: string }[] = [
  { grade: 'again', label: 'Lại', className: 'grade grade--again' },
  { grade: 'hard', label: 'Khó', className: 'grade grade--hard' },
  { grade: 'good', label: 'Được', className: 'grade grade--good' },
  { grade: 'easy', label: 'Dễ', className: 'grade grade--easy' },
]

/**
 * Flashcard review session: builds a queue of due cards (SRS), flips to reveal
 * the definition, and grades via the 4-button scale that feeds back into SM-2.
 * Content comes live from Dexie, so an import mid-session is picked up next time
 * the queue is rebuilt.
 */
export function FlashcardsPage() {
  const cards = useLiveQuery(() => db.vocab.toArray())
  const [queue, setQueue] = useState<string[]>([])
  const [pos, setPos] = useState(0)
  const [revealed, setRevealed] = useState(false)

  // Build the due-queue once the cards have loaded.
  useEffect(() => {
    if (!cards) return
    let active = true
    dueCardIds(cards.map((c) => c.id)).then((due) => {
      if (!active) return
      setQueue(due.length ? due : cards.map((c) => c.id))
    })
    return () => {
      active = false
    }
  }, [cards])

  const byId = useMemo(
    () => new Map((cards ?? []).map((c) => [c.id, c])),
    [cards],
  )
  const current = byId.get(queue[pos])

  async function grade(g: Grade) {
    if (!current) return
    await gradeFlashcard(current.id, g)
    setRevealed(false)
    setPos((p) => p + 1)
  }

  if (!cards) return <div className="page"><p>Đang tải…</p></div>

  if (!cards.length) {
    return (
      <div className="page">
        <h2>Chưa có từ vựng</h2>
        <p className="muted">Hãy nhập nội dung của bạn để bắt đầu học.</p>
        <Link className="cta" to="/import">⬆️ Nhập nội dung</Link>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="page">
        <h2>🎉 Xong phiên ôn!</h2>
        <p className="muted">Bạn đã ôn hết các thẻ đến hạn hôm nay.</p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="progress-bar">
        {pos + 1} / {queue.length}
      </div>

      <button
        className="flashcard"
        onClick={() => setRevealed(true)}
        aria-label="Lật thẻ"
      >
        <div className="flashcard__term">{current.term}</div>
        {revealed ? (
          <div className="flashcard__back">
            <p>{current.definition}</p>
            {current.translation && (
              <p className="muted">{current.translation}</p>
            )}
            {current.example && <p className="example">“{current.example}”</p>}
          </div>
        ) : (
          <div className="muted">Chạm để xem nghĩa</div>
        )}
      </button>

      {revealed && (
        <div className="grade-row">
          {GRADES.map((g) => (
            <button
              key={g.grade}
              className={g.className}
              onClick={() => grade(g.grade)}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
