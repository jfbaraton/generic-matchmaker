import './NavBar.css'

const STEPS = [
  { id: 'setup', label: '⚙️ Setup' },
  { id: 'players', label: '👥 Players' },
  { id: 'schedule', label: '📅 Schedule' },
  { id: 'results', label: '🏆 Results' },
]

export default function NavBar({ view, dispatch, canAdvancePlayers, hasSchedule }) {
  function isUnlocked(id) {
    if (id === 'setup') return true
    if (id === 'players') return true
    if (id === 'schedule') return canAdvancePlayers
    if (id === 'results') return hasSchedule
    return false
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">🎯 Generic Matchmaker</div>
      <div className="navbar-steps">
        {STEPS.map((step, i) => {
          const unlocked = isUnlocked(step.id)
          const active = view === step.id
          return (
            <button
              key={step.id}
              className={`step-btn ${active ? 'active' : ''} ${!unlocked ? 'disabled' : ''}`}
              onClick={() => unlocked && dispatch({ type: 'SET_VIEW', payload: step.id })}
              disabled={!unlocked}
            >
              <span className="step-num">{i + 1}</span>
              {step.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

