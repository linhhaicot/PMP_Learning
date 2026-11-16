import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import type { Question, VocabCard } from '../../types'
import { db } from '../../db/schema'
import { logAnswer } from '../../db/reviews'
import { QuestionCard } from '../../components/QuestionCard'

/**
 * Vocabulary quiz: generates multiple-choice questions on the fly from the
 * vocabulary set (definition shown, pick the correct term), logging each
 * answer for progress tracking.
 */
export function QuizPage() {
  const cards = useLiveQuery(() => db.vocab.toArray())
  const questions = useMemo(() => buildQuestions(cards ?? []), [cards])

  if (!cards) return <div className="page"><p>Đang tải…</p></div>

  if (cards.length < 2) {
    return (
      <div className="page">
        <h2>Chưa đủ từ vựng</h2>
        <p className="muted">Cần ít nhất 2 từ để tạo quiz. Hãy nhập thêm nội dung.</p>
        <Link className="cta" to="/import">⬆️ Nhập nội dung</Link>
      </div>
    )
  }

  return (
    <div className="page">
      <h2>Quiz từ vựng</h2>
      {questions.map((q) => (
        <QuestionCard
          key={q.id}
          question={q}
          onAnswer={(correct) => logAnswer(q.id, 'quiz', correct)}
        />
      ))}
    </div>
  )
}

/** Build one "which term matches this definition?" question per card. */
function buildQuestions(cards: VocabCard[]): Question[] {
  return cards.map((card, i) => {
    const distractors = cards.filter((c) => c.id !== card.id).map((c) => c.term)
    const choices = shuffle([card.term, ...distractors.slice(0, 3)], i)
    return {
      id: `quiz-${card.id}`,
      prompt: card.definition,
      choices,
      answerIndex: choices.indexOf(card.term),
      explanation: card.translation,
    }
  })
}

/** Deterministic shuffle seeded by index so renders stay stable. */
function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = (seed * 9301 + 49297 + i * 233) % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
