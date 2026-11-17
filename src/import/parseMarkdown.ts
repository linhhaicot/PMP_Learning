import type { PmpDomain, Question, Reading, VocabCard } from '../types'

/**
 * Deterministic parser for the PMLingo content template (see
 * public/templates/content-template.md). Pure and line-based so it is fully
 * unit-testable and never guesses: anything that doesn't match the template
 * becomes a reported error rather than a silent best-effort import.
 *
 * Document structure:
 *   # Vocabulary
 *   ## <term>
 *   - key: value        (definition required; pos/domain/translation/example/tags optional)
 *   # Readings
 *   ## <title>
 *   <passage paragraphs, blank line = paragraph break>
 *   ### Q: <prompt>
 *   - [ ] choice / - [x] correct choice   (exactly one [x], >= 2 choices)
 *   > Explanation: <text>
 */

export interface ImportError {
  line: number
  message: string
}

export interface ParseResult {
  vocab: VocabCard[]
  readings: Reading[]
  errors: ImportError[]
}

// Drafts carry the source line number so errors can point at it; the line is
// stripped before the clean domain object is emitted.
type DraftCard = VocabCard & { line: number }
type DraftQuestion = Question & { line: number }
type DraftReading = Omit<Reading, 'questions'> & {
  line: number
  questions: Question[]
}

type Section = 'vocab' | 'reading' | null

const VOCAB_KEYS = new Set(['pos', 'domain', 'translation', 'definition', 'example', 'tags', 'priority'])
const DOMAINS: string[] = ['People', 'Process', 'Business Environment', 'General']
const PRIORITIES: string[] = ['high', 'medium', 'low']

export function parseMarkdown(input: string): ParseResult {
  const lines = input.split(/\r?\n/)
  const errors: ImportError[] = []
  const vocab: VocabCard[] = []
  const readings: Reading[] = []

  let section: Section = null
  let card: DraftCard | null = null
  let reading: DraftReading | null = null
  let question: DraftQuestion | null = null
  let passageLines: string[] = []

  const flushCard = () => {
    if (!card) return
    const { line, ...clean } = card
    if (!clean.definition.trim()) {
      errors.push({ line, message: `Từ "${clean.term}" thiếu "definition".` })
    } else {
      vocab.push(clean)
    }
    card = null
  }

  const flushQuestion = () => {
    if (!question || !reading) return
    const { line, ...clean } = question
    if (clean.choices.length < 2) {
      errors.push({ line, message: `Câu hỏi "${clean.prompt}" cần ít nhất 2 lựa chọn.` })
    } else if (clean.answerIndex < 0) {
      errors.push({ line, message: `Câu hỏi "${clean.prompt}" chưa đánh dấu đáp án đúng ([x]).` })
    } else {
      clean.id = `${reading.id}-q${reading.questions.length + 1}`
      reading.questions.push(clean)
    }
    question = null
  }

  const flushReading = () => {
    flushQuestion()
    if (!reading) return
    const { line, ...clean } = reading
    clean.passage = passageLines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
    passageLines = []
    if (!clean.passage) {
      errors.push({ line, message: `Bài đọc "${clean.title}" thiếu đoạn văn.` })
    } else if (clean.questions.length === 0) {
      errors.push({ line, message: `Bài đọc "${clean.title}" chưa có câu hỏi nào.` })
    } else {
      readings.push(clean)
    }
    reading = null
  }

  lines.forEach((raw, i) => {
    const lineNo = i + 1
    const line = raw.trimEnd()

    const h1 = /^#\s+(.+)$/.exec(line)
    if (h1) {
      flushCard()
      flushReading()
      const name = h1[1].trim().toLowerCase()
      if (name === 'vocabulary' || name === 'từ vựng') section = 'vocab'
      else if (name === 'readings' || name === 'reading' || name === 'bài đọc') section = 'reading'
      else {
        section = null
        errors.push({ line: lineNo, message: `Mục không hợp lệ "# ${h1[1].trim()}" (chỉ nhận "# Vocabulary" hoặc "# Readings").` })
      }
      return
    }

    const h2 = /^##\s+(.+)$/.exec(line)
    if (h2) {
      const title = h2[1].trim()
      if (section === 'vocab') {
        flushCard()
        card = { line: lineNo, id: slug('v', title), term: title, definition: '' }
      } else if (section === 'reading') {
        flushReading()
        reading = { line: lineNo, id: slug('r', title), title, passage: '', questions: [] }
      } else {
        errors.push({ line: lineNo, message: `"## ${title}" nằm ngoài mục Vocabulary/Readings.` })
      }
      return
    }

    const h3 = /^###\s+(.+)$/.exec(line)
    if (h3 && section === 'reading' && reading) {
      flushQuestion()
      const prompt = h3[1].replace(/^Q:\s*/i, '').trim()
      question = { line: lineNo, id: '', prompt, choices: [], answerIndex: -1 }
      return
    }

    // Vocab field: "- key: value"
    if (section === 'vocab' && card && /^-\s+/.test(line)) {
      const m = /^-\s+([a-zA-Z]+)\s*:\s*(.*)$/.exec(line)
      if (!m) {
        errors.push({ line: lineNo, message: `Dòng thuộc tính sai định dạng (cần "- key: value"): ${line}` })
        return
      }
      applyVocabField(card, m[1].toLowerCase(), m[2].trim(), lineNo, errors)
      return
    }

    // Reading choice: "- [ ] text" / "- [x] text", or "> Explanation: ..."
    if (section === 'reading' && question) {
      const c = /^-\s+\[([ xX])\]\s+(.+)$/.exec(line)
      if (c) {
        if (c[1].toLowerCase() === 'x') question.answerIndex = question.choices.length
        question.choices.push(c[2].trim())
        return
      }
      const exp = /^>\s*(?:Explanation:\s*)?(.+)$/i.exec(line)
      if (exp) {
        question.explanation = exp[1].trim()
        return
      }
    }

    // Passage text (reading, before any question).
    if (section === 'reading' && reading && !question) {
      passageLines.push(raw)
      return
    }
  })

  flushCard()
  flushReading()

  return { vocab, readings, errors }
}

function applyVocabField(
  card: DraftCard,
  key: string,
  value: string,
  lineNo: number,
  errors: ImportError[],
) {
  if (!VOCAB_KEYS.has(key)) {
    errors.push({ line: lineNo, message: `Thuộc tính không hợp lệ "${key}" (nhận: definition, translation, example, pos, domain, priority, tags).` })
    return
  }
  switch (key) {
    case 'definition':
      card.definition = value
      break
    case 'translation':
      card.translation = value
      break
    case 'example':
      card.example = value
      break
    case 'pos':
      card.partOfSpeech = value
      break
    case 'tags':
      card.tags = value.split(',').map((t) => t.trim()).filter(Boolean)
      break
    case 'domain':
      if (DOMAINS.includes(value)) card.domain = value as PmpDomain
      else errors.push({ line: lineNo, message: `domain "${value}" không hợp lệ (People, Process, Business Environment, General).` })
      break
    case 'priority':
      if (PRIORITIES.includes(value)) card.priority = value as VocabCard['priority']
      else errors.push({ line: lineNo, message: `priority "${value}" không hợp lệ (high, medium, low).` })
      break
  }
}

/** URL-safe slug with a type prefix, e.g. slug('v', 'Change Control') → 'v-change-control'. */
function slug(prefix: string, text: string): string {
  const s = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${prefix}-${s || 'item'}`
}
