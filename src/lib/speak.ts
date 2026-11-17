/**
 * Thin wrapper over the Web Speech API for reading English terms aloud on the
 * flashcard screen. No-ops gracefully where speechSynthesis is unavailable.
 */

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

export function speak(text: string, lang = 'en-US'): void {
  if (!supported || !text) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = 0.95
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking(): void {
  if (supported) window.speechSynthesis.cancel()
}

export const speechSupported = supported
