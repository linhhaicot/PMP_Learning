import { createHashRouter } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { HomePage } from './features/progress/HomePage'
import { FlashcardsPage } from './features/flashcards/FlashcardsPage'
import { QuizPage } from './features/quiz/QuizPage'
import { ReadingPage } from './features/reading/ReadingPage'
import { ImportPage } from './features/import/ImportPage'

/**
 * Single-source route table. Each of the four learning features is a route
 * under the shared AppLayout (which renders the bottom tab bar).
 *
 * HashRouter is used so the app works when served from a GitHub Pages subpath
 * (e.g. /PMP_Learning/) without needing a server-side SPA fallback.
 */
export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'flashcards', element: <FlashcardsPage /> },
      { path: 'quiz', element: <QuizPage /> },
      { path: 'reading', element: <ReadingPage /> },
      { path: 'import', element: <ImportPage /> },
    ],
  },
])
