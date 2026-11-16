import { useState } from 'react'
import type { Question } from '../types'

/**
 * Reusable multiple-choice question UI, shared by the Quiz and Reading
 * features. Owns only its answered/selection state; reports the result up via
 * `onAnswer` so the parent decides how to log it.
 */
export function QuestionCard({
  question,
  onAnswer,
}: {
  question: Question
  onAnswer: (correct: boolean) => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const answered = selected !== null

  function choose(i: number) {
    if (answered) return
    setSelected(i)
    onAnswer(i === question.answerIndex)
  }

  return (
    <div className="question">
      <p className="question__prompt">{question.prompt}</p>
      <div className="question__choices">
        {question.choices.map((choice, i) => (
          <button
            key={i}
            className={choiceClass(i, selected, question.answerIndex)}
            onClick={() => choose(i)}
            disabled={answered}
          >
            {choice}
          </button>
        ))}
      </div>
      {answered && question.explanation && (
        <p className="question__explanation">{question.explanation}</p>
      )}
    </div>
  )
}

function choiceClass(
  i: number,
  selected: number | null,
  answer: number,
): string {
  const base = 'choice'
  if (selected === null) return base
  if (i === answer) return base + ' choice--correct'
  if (i === selected) return base + ' choice--wrong'
  return base
}
