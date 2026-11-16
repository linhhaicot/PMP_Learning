import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { ParseResult } from '../../import/parseMarkdown'
import { preview, commit, clearContent } from '../../db/importContent'
import { db } from '../../db/schema'

/**
 * Import screen: paste Markdown or pick a .md file, preview the parsed counts
 * and any errors, then commit. Nothing is written until "Nhập" is pressed, and
 * a parse with errors cannot be committed (parser is strict by design).
 */
export function ImportPage() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<ParseResult | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const counts = useLiveQuery(async () => ({
    vocab: await db.vocab.count(),
    readings: await db.readings.count(),
  }))

  function runPreview(value: string) {
    setDone(null)
    setResult(value.trim() ? preview(value) : null)
  }

  function onText(value: string) {
    setText(value)
    runPreview(value)
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const value = await file.text()
    setText(value)
    runPreview(value)
  }

  async function doImport() {
    if (!result || result.errors.length) return
    const summary = await commit(result)
    setDone(`Đã nhập ${summary.vocabCount} từ vựng và ${summary.readingCount} bài đọc.`)
    setText('')
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function doClear() {
    if (!confirm('Xóa toàn bộ từ vựng và bài đọc đã lưu? Tiến độ học vẫn được giữ.')) return
    await clearContent()
    setDone('Đã xóa sạch nội dung.')
  }

  const canImport = result && result.errors.length === 0 &&
    (result.vocab.length > 0 || result.readings.length > 0)

  return (
    <div className="page">
      <h2>Nhập nội dung</h2>
      <p className="muted">
        Dán Markdown theo mẫu, hoặc chọn file <code>.md</code>.{' '}
        <a href={`${import.meta.env.BASE_URL}templates/content-template.md`} download>
          Tải template
        </a>
      </p>

      <div className="import-actions">
        <input
          ref={fileRef}
          type="file"
          accept=".md,.markdown,.txt,text/markdown,text/plain"
          onChange={onFile}
        />
      </div>

      <textarea
        className="import-textarea"
        placeholder="# Vocabulary&#10;## Stakeholder&#10;- definition: ..."
        value={text}
        onChange={(e) => onText(e.target.value)}
        rows={12}
      />

      {result && (
        <div className="import-preview">
          <p>
            Phát hiện: <strong>{result.vocab.length}</strong> từ vựng,{' '}
            <strong>{result.readings.length}</strong> bài đọc.
          </p>
          {result.errors.length > 0 && (
            <div className="import-errors">
              <p>⚠️ {result.errors.length} lỗi — sửa xong mới nhập được:</p>
              <ul>
                {result.errors.map((e, i) => (
                  <li key={i}>Dòng {e.line}: {e.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {done && <p className="import-done">✅ {done}</p>}

      <div className="import-buttons">
        <button className="cta" onClick={doImport} disabled={!canImport}>
          Nhập
        </button>
        <button className="btn-danger" onClick={doClear}>
          Xóa sạch nội dung
        </button>
      </div>

      <p className="muted import-count">
        Đang lưu: {counts?.vocab ?? 0} từ vựng · {counts?.readings ?? 0} bài đọc
      </p>
    </div>
  )
}
