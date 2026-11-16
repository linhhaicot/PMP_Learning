// Shared domain types for the PMP English Learning app.

/** PMP process groups — used to tag/filter vocabulary by exam context. */
export type PmpDomain =
  | 'People'
  | 'Process'
  | 'Business Environment'
  | 'General'

/** A single vocabulary / terminology card (static content, shipped as JSON). */
export interface VocabCard {
  id: string
  term: string
  /** English definition. */
  definition: string
  /** Vietnamese gloss to speed up learning. */
  translation?: string
  example?: string
  partOfSpeech?: string
  domain?: PmpDomain
  tags?: string[]
}

/** A reading-comprehension passage with its questions (static content). */
export interface Reading {
  id: string
  title: string
  /** Full English passage, may contain multiple paragraphs separated by \n\n. */
  passage: string
  questions: Question[]
}

/** A multiple-choice question, reused by both Quiz and Reading features. */
export interface Question {
  id: string
  prompt: string
  choices: string[]
  /** Index into `choices` of the correct answer. */
  answerIndex: number
  explanation?: string
}

/** How the learner graded their recall of a card during a flashcard review. */
export type Grade = 'again' | 'hard' | 'good' | 'easy'
