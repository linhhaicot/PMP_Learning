import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { parseMarkdown } from './parseMarkdown'

const GOOD = `# Vocabulary

## Stakeholder
- pos: noun
- domain: People
- translation: Các bên liên quan
- definition: An individual or group that may affect a project.
- tags: initiating, communication

# Readings

## Change Control
First paragraph.

Second paragraph.

### Q: Why wait?
- [ ] No reason
- [x] It must be approved first
> Explanation: Integrated change control.
`

describe('parseMarkdown', () => {
  it('parses vocab with fields and a slug id', () => {
    const { vocab, errors } = parseMarkdown(GOOD)
    expect(errors).toHaveLength(0)
    expect(vocab).toHaveLength(1)
    expect(vocab[0]).toMatchObject({
      id: 'v-stakeholder',
      term: 'Stakeholder',
      domain: 'People',
      partOfSpeech: 'noun',
      tags: ['initiating', 'communication'],
    })
  })

  it('parses readings with multi-paragraph passage and questions', () => {
    const { readings } = parseMarkdown(GOOD)
    expect(readings).toHaveLength(1)
    const r = readings[0]
    expect(r.id).toBe('r-change-control')
    expect(r.passage).toBe('First paragraph.\n\nSecond paragraph.')
    expect(r.questions).toHaveLength(1)
    expect(r.questions[0]).toMatchObject({
      id: 'r-change-control-q1',
      answerIndex: 1,
      explanation: 'Integrated change control.',
    })
  })

  it('flags a vocab entry missing its definition', () => {
    const { vocab, errors } = parseMarkdown('# Vocabulary\n## Orphan\n- pos: noun\n')
    expect(vocab).toHaveLength(0)
    expect(errors[0].message).toContain('definition')
  })

  it('flags a question with no correct answer', () => {
    const md = '# Readings\n## R\nText.\n### Q: pick\n- [ ] a\n- [ ] b\n'
    const { errors } = parseMarkdown(md)
    expect(errors.some((e) => e.message.includes('đáp án đúng'))).toBe(true)
  })

  it('flags an unknown vocab attribute with its line number', () => {
    const md = '# Vocabulary\n## X\n- definition: d\n- bogus: y\n'
    const { errors } = parseMarkdown(md)
    expect(errors[0]).toMatchObject({ line: 4 })
    expect(errors[0].message).toContain('bogus')
  })

  it('rejects an unknown top-level section', () => {
    const { errors } = parseMarkdown('# Nonsense\n## X\n')
    expect(errors.some((e) => e.message.includes('không hợp lệ'))).toBe(true)
  })

  // Guards that the shipped template (what the user fills in) always parses
  // cleanly — if the template and parser ever drift, this fails.
  it('parses the shipped content template with no errors', () => {
    const path = resolve(process.cwd(), 'public/templates/content-template.md')
    const md = readFileSync(path, 'utf8')
    const { vocab, readings, errors } = parseMarkdown(md)
    expect(errors).toHaveLength(0)
    expect(vocab.length).toBeGreaterThanOrEqual(2)
    expect(readings[0].questions.length).toBeGreaterThanOrEqual(2)
  })
})
