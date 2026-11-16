import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../../db/schema'

/**
 * Dashboard: live progress stats driven by Dexie's useLiveQuery, so the
 * numbers update the instant a review is recorded anywhere in the app.
 */
export function HomePage() {
  const stats = useLiveQuery(async () => {
    const daily = await db.daily.toArray()
    const learned = await db.progress.count()
    const today = new Date().toISOString().slice(0, 10)
    const todayRow = daily.find((d) => d.date === today)
    return {
      learned,
      todayReviewed: todayRow?.reviewed ?? 0,
      streak: computeStreak(daily.map((d) => d.date)),
    }
  })

  return (
    <div className="page">
      <h1>PMLingo</h1>
      <p className="muted">Học từ vựng & đọc hiểu cho kỳ thi PMP</p>

      <div className="stat-grid">
        <Stat label="Từ đã học" value={stats?.learned ?? 0} />
        <Stat label="Ôn hôm nay" value={stats?.todayReviewed ?? 0} />
        <Stat label="Chuỗi ngày" value={stats?.streak ?? 0} />
      </div>

      <div className="cta-grid">
        <Link className="cta" to="/flashcards">🃏 Ôn Flashcard</Link>
        <Link className="cta" to="/quiz">✅ Làm Quiz</Link>
        <Link className="cta" to="/reading">📖 Đọc hiểu</Link>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <div className="stat__value">{value}</div>
      <div className="stat__label">{label}</div>
    </div>
  )
}

/** Count consecutive days ending today (or yesterday) that had activity. */
function computeStreak(dates: string[]): number {
  const set = new Set(dates)
  let streak = 0
  const cursor = new Date()
  // Allow the streak to still count if today has no activity yet.
  if (!set.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1)
  }
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
