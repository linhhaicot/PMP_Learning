import { db } from './schema'
import { parseMarkdown, type ParseResult } from '../import/parseMarkdown'

/**
 * Bridge between the pure Markdown parser and Dexie. Parsing never touches the
 * DB; committing is a separate, explicit step so the Import UI can show counts
 * and errors before anything is written.
 */

export interface ImportSummary {
  vocabCount: number
  readingCount: number
}

/** Parse without writing — used to preview counts/errors in the UI. */
export function preview(markdown: string): ParseResult {
  return parseMarkdown(markdown)
}

/**
 * Commit parsed content additively: existing items with the same id are
 * overwritten (re-importing an updated term replaces the old one), new items
 * are added, and untouched items are kept. SRS progress keys off the stable
 * slug id, so re-importing a term preserves its review history.
 */
export async function commit(result: ParseResult): Promise<ImportSummary> {
  await db.transaction('rw', db.vocab, db.readings, async () => {
    if (result.vocab.length) await db.vocab.bulkPut(result.vocab)
    if (result.readings.length) await db.readings.bulkPut(result.readings)
  })
  return {
    vocabCount: result.vocab.length,
    readingCount: result.readings.length,
  }
}

/** Wipe all imported content (not progress/stats) so the user can start over. */
export async function clearContent(): Promise<void> {
  await db.transaction('rw', db.vocab, db.readings, async () => {
    await db.vocab.clear()
    await db.readings.clear()
  })
}
