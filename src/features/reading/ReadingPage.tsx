import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../../db/schema'
import { logAnswer } from '../../db/reviews'
import { QuestionCard } from '../../components/QuestionCard'

/**
 * Reading comprehension: shows an English passage followed by its multiple-
 * choice questions. Answers are logged for progress tracking.
 */
export function ReadingPage() {
  const readings = useLiveQuery(() => db.readings.toArray())
  const [index, setIndex] = useState(0)

  if (!readings) return <div className="page"><p>Đang tải…</p></div>

  if (!readings.length) {
    return (
      <div className="page">
        <h2>Chưa có bài đọc</h2>
        <p className="muted">Hãy nhập nội dung có mục Readings để luyện đọc hiểu.</p>
        <Link className="cta" to="/import">⬆️ Nhập nội dung</Link>
      </div>
    )
  }

  const reading = readings[Math.min(index, readings.length - 1)]

  return (
    <div className="page">
      <h2>{reading.title}</h2>
      <article className="passage">
        {reading.passage.split('\n\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </article>

      {reading.questions.map((q) => (
        <QuestionCard
          key={q.id}
          question={q}
          onAnswer={(correct) => logAnswer(q.id, 'reading', correct)}
        />
      ))}

      {index < readings.length - 1 && (
        <button className="cta" onClick={() => setIndex((i) => i + 1)}>
          Bài tiếp theo →
        </button>
      )}
    </div>
  )
}
