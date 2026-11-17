import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import type { Grade, VocabCard } from '../../types'
import { db } from '../../db/schema'
import { buildStudyQueue, gradeFlashcard } from '../../db/reviews'
import { speak, stopSpeaking, speechSupported } from '../../lib/speak'

const GRADES: { grade: Grade; label: string; className: string }[] = [
  { grade: 'again', label: 'Lại', className: 'grade grade--again' },
  { grade: 'hard', label: 'Khó', className: 'grade grade--hard' },
  { grade: 'good', label: 'Được', className: 'grade grade--good' },
  { grade: 'easy', label: 'Dễ', className: 'grade grade--easy' },
]

const PRIORITY_BADGE: Record<string, string> = {
  high: '🔴 Ưu tiên cao',
  medium: '🟡 Thường',
  low: '⚪ Lướt',
}

// Auto-play timings (ms): reveal the definition, then advance.
const REVEAL_DELAY = 2500
const ADVANCE_DELAY = 6000
const SWIPE_THRESHOLD = 50

/**
 * Flashcard review. The queue is ordered by priority (high → low) then SRS
 * urgency (see buildStudyQueue), so core PMP terms come before skim terms.
 *
 * Interactions:
 *  - Tap the card to reveal; grade with the 4 buttons (feeds SM-2).
 *  - 🔊 reads the term aloud (and the definition once revealed).
 *  - Swipe left/right (or the ‹ › buttons) to browse without grading.
 *  - Auto-play reveals + advances hands-free, reading each card aloud.
 */
export function FlashcardsPage() {
  const cards = useLiveQuery(() => db.vocab.toArray())
  const [queue, setQueue] = useState<VocabCard[]>([])
  const [pos, setPos] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [auto, setAuto] = useState(false)
  const [filter, setFilter] = useState<'all' | 'high'>('all')
  const touchStartX = useRef<number | null>(null)

  // (Re)build the ordered queue when the content or the filter changes.
  useEffect(() => {
    if (!cards) return
    let active = true
    const pool = filter === 'high'
      ? cards.filter((c) => c.priority === 'high')
      : cards
    buildStudyQueue(pool).then((ordered) => {
      if (!active) return
      setQueue(ordered)
      setPos(0)
      setRevealed(false)
    })
    return () => {
      active = false
    }
  }, [cards, filter])

  const current = queue[pos]

  function go(delta: number) {
    stopSpeaking()
    setRevealed(false)
    setPos((p) => Math.min(Math.max(p + delta, 0), queue.length))
  }

  async function grade(g: Grade) {
    if (!current) return
    stopSpeaking()
    await gradeFlashcard(current.id, g)
    setRevealed(false)
    setPos((p) => p + 1)
  }

  // Auto-play loop: one timer chain per card, torn down on card/mode change.
  useEffect(() => {
    if (!auto || !current) return
    speak(current.term)
    const t1 = setTimeout(() => {
      setRevealed(true)
      if (current.definition) speak(current.definition)
    }, REVEAL_DELAY)
    const t2 = setTimeout(() => {
      setRevealed(false)
      setPos((p) => p + 1)
    }, ADVANCE_DELAY)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      stopSpeaking()
    }
  }, [auto, current])

  // Stop speaking when leaving the screen.
  useEffect(() => stopSpeaking, [])

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (dx < -SWIPE_THRESHOLD) go(1)
    else if (dx > SWIPE_THRESHOLD) go(-1)
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

  const filterBar = (
    <div className="fc-filter">
      <button
        className={'fc-chip' + (filter === 'all' ? ' fc-chip--on' : '')}
        onClick={() => setFilter('all')}
      >
        Tất cả
      </button>
      <button
        className={'fc-chip' + (filter === 'high' ? ' fc-chip--on' : '')}
        onClick={() => setFilter('high')}
      >
        🔴 Ưu tiên cao
      </button>
    </div>
  )

  if (!queue.length) {
    return (
      <div className="page">
        {filterBar}
        <p className="muted">Không có từ nào ở mức "Ưu tiên cao". Chọn "Tất cả" để học mọi từ.</p>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="page">
        {filterBar}
        <h2>🎉 Xong phiên ôn!</h2>
        <p className="muted">Bạn đã xem hết các thẻ trong phiên này.</p>
        <button className="cta" onClick={() => { setAuto(false); go(-pos) }}>
          Học lại từ đầu
        </button>
      </div>
    )
  }

  return (
    <div className="page">
      {filterBar}
      <div className="fc-topbar">
        <span className="progress-bar">{pos + 1} / {queue.length}</span>
        <span className="fc-badge">{PRIORITY_BADGE[current.priority ?? 'medium']}</span>
      </div>

      <button
        className="flashcard"
        onClick={() => setRevealed(true)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-label="Lật thẻ"
      >
        <div className="flashcard__term">{current.term}</div>
        {revealed ? (
          <div className="flashcard__back">
            <p>{current.definition}</p>
            {current.translation && <p className="muted">{current.translation}</p>}
            {current.example && <p className="example">“{current.example}”</p>}
          </div>
        ) : (
          <div className="muted">Chạm để xem nghĩa · vuốt để chuyển</div>
        )}
      </button>

      <div className="fc-controls">
        <button className="fc-btn" onClick={() => go(-1)} disabled={pos === 0} aria-label="Thẻ trước">‹</button>
        {speechSupported && (
          <button
            className="fc-btn"
            onClick={() => speak(revealed && current.definition ? `${current.term}. ${current.definition}` : current.term)}
            aria-label="Đọc to"
          >
            🔊 Nghe
          </button>
        )}
        <button
          className={'fc-btn' + (auto ? ' fc-btn--on' : '')}
          onClick={() => setAuto((a) => !a)}
        >
          {auto ? '⏸ Dừng' : '▶️ Tự động'}
        </button>
        <button className="fc-btn" onClick={() => go(1)} aria-label="Thẻ sau">›</button>
      </div>

      {revealed && !auto && (
        <div className="grade-row">
          {GRADES.map((g) => (
            <button key={g.grade} className={g.className} onClick={() => grade(g.grade)}>
              {g.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
