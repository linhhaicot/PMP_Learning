import { db } from './schema'
import type { Reading, VocabCard } from '../types'

/**
 * One-time demo seed. On first run the content tables are empty, so we load the
 * bundled sample JSON from /public/data to give the app something to show until
 * the user imports their own Markdown. Once any content exists (seeded or
 * imported) this is a no-op, so it never clobbers imported data.
 */
export async function seedIfEmpty(): Promise<void> {
  const count = await db.vocab.count()
  if (count > 0) return

  // BASE_URL ('/' locally, '/<repo>/' on GitHub Pages) keeps these absolute at
  // runtime; a literal '/data/...' would 404 when served from a subpath.
  const base = import.meta.env.BASE_URL
  const [vocab, readings] = await Promise.all([
    fetch(`${base}data/vocabulary.json`).then((r) => r.json() as Promise<VocabCard[]>),
    fetch(`${base}data/readings.json`).then((r) => r.json() as Promise<Reading[]>),
  ])

  await db.transaction('rw', db.vocab, db.readings, async () => {
    await db.vocab.bulkPut(vocab)
    await db.readings.bulkPut(readings)
  })
}
