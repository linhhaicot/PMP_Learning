import { NavLink, Outlet } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Trang chủ', icon: '🏠', end: true },
  { to: '/flashcards', label: 'Flashcard', icon: '🃏' },
  { to: '/quiz', label: 'Quiz', icon: '✅' },
  { to: '/reading', label: 'Đọc hiểu', icon: '📖' },
  { to: '/import', label: 'Nhập', icon: '⬆️' },
]

/** App chrome: a scrollable content area plus a fixed bottom tab bar. */
export function AppLayout() {
  return (
    <div className="app">
      <main className="app__content">
        <Outlet />
      </main>
      <nav className="tabbar">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              'tabbar__item' + (isActive ? ' tabbar__item--active' : '')
            }
          >
            <span className="tabbar__icon">{t.icon}</span>
            <span className="tabbar__label">{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
