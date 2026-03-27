import { generateNextRound, sameTeamComposition } from '../../state/scheduleEngine.js'
import ScheduleView from './ScheduleView.jsx'
import './SchedulePanel.css'

export default function SchedulePanel({
  players, playersPerTeam, numFields, sport,
  rounds, scores, dispatch,
}) {
  const activePlayers = players.filter(p => !p.onBreak)
  const breakPlayers  = players.filter(p => p.onBreak)
  const matchSize     = playersPerTeam * 2
  const canGenerate   = activePlayers.length >= matchSize

  // Last round state
  const lastRound     = rounds[rounds.length - 1] ?? null
  const lastRoundIdx  = rounds.length - 1
  const lastHasLocked = lastRound?.matches.some(m => scores[m.id]?.locked) ?? false
  const anyLocked     = rounds.some(r => r.matches.some(m => scores[m.id]?.locked))
  const canRegenerate = rounds.length > 0 && !lastHasLocked
  const canClear      = rounds.length > 0 && !anyLocked

  function handleGenerateRound() {
    const roundData = generateNextRound(players, playersPerTeam, numFields)
    dispatch({ type: 'ADD_ROUND', payload: { id: crypto.randomUUID(), ...roundData } })
  }

  function handleRegenerateLast() {
    if (!lastRound || lastHasLocked) return
    // Reverse the old delta so the algorithm sees accurate gamesPlayed
    const oldDelta = lastRound.gamesPlayedDelta || {}
    const playersForAlgo = players.map(p => ({
      ...p,
      gamesPlayed: p.gamesPlayed - (oldDelta[p.id] || 0),
    }))

    // Players not on the field in the old round (break + forced sit-out)
    const oldSitIds = new Set([
      ...(lastRound.onBreak   || []).map(p => p.id),
      ...(lastRound.sittingOut || []).map(p => p.id),
    ])

    const MAX_ATTEMPTS = 40
    let best = null   // best candidate found so far (different teams, maybe same sitting)

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const candidate = generateNextRound(playersForAlgo, playersPerTeam, numFields)

      // Hard: at least one team must differ
      if (sameTeamComposition(lastRound, candidate)) continue

      // Check whether sitting players changed
      const newSitIds = new Set([
        ...(candidate.onBreak   || []).map(p => p.id),
        ...(candidate.sittingOut || []).map(p => p.id),
      ])
      const sameSitting =
        oldSitIds.size === newSitIds.size &&
        [...oldSitIds].every(id => newSitIds.has(id))

      if (!sameSitting) {
        // Different teams AND different sitting — ideal, stop here
        best = candidate
        break
      }

      // Teams differ but sitting is the same — keep as fallback
      if (!best) best = candidate
    }

    if (!best) return // extremely unlikely: all attempts failed (e.g. only one possible pairing)
    dispatch({ type: 'REGENERATE_LAST_ROUND', payload: { id: crypto.randomUUID(), ...best } })
  }

  return (
    <div className="schedule-panel">
      {/* ── Controls card ─────────────────────────────────────────── */}
      <div className="card schedule-controls">
        <h2 className="panel-title">📅 Schedule</h2>
        <p className="panel-subtitle">
          {sport} · {players.length} players · {playersPerTeam}/team · {numFields} field{numFields !== 1 ? 's' : ''}
        </p>

        {/* Break toggles ------------------------------------------ */}
        <div className="break-section">
          <div className="break-label">
            ☕ Round {rounds.length + 1} break roster
            <span className="break-count">
              {breakPlayers.length > 0
                ? `${breakPlayers.length} on break`
                : 'everyone playing'}
            </span>
          </div>
          <div className="break-chips">
            {players.map(p => (
              <button
                key={p.id}
                className={`break-chip ${p.onBreak ? 'on-break' : ''}`}
                onClick={() => dispatch({ type: 'TOGGLE_PLAYER_BREAK', payload: { id: p.id } })}
                title={p.onBreak ? 'Click to un-break' : 'Click to take a break'}
              >
                {p.onBreak ? '☕' : '▶'} {p.name}
                <span className="chip-elo">⭐{p.elo}</span>
              </button>
            ))}
          </div>
        </div>

        {!canGenerate && (
          <div className="warn-box">
            ⚠️ Need at least {matchSize} active (non-break) players to generate a round.
          </div>
        )}

        <div className="controls-actions">
          <button className="btn-primary" disabled={!canGenerate} onClick={handleGenerateRound}>
            ⚡ Generate Round {rounds.length + 1}
          </button>

          {canRegenerate && (
            <button className="btn-secondary" onClick={handleRegenerateLast}>
              🔄 Re-roll Round {lastRoundIdx + 1}
            </button>
          )}

          {canRegenerate && (
            <button
              className="btn-danger-outline"
              onClick={() => {
                if (window.confirm(`Delete Round ${lastRoundIdx + 1}? This cannot be undone.`)) {
                  dispatch({ type: 'REMOVE_LAST_ROUND' })
                }
              }}
            >
              🗑️ Delete Round {lastRoundIdx + 1}
            </button>
          )}

          {rounds.length > 0 && (
            <button
              className="btn-secondary"
              onClick={() => dispatch({ type: 'SET_VIEW', payload: 'results' })}
            >
              View Results 🏆
            </button>
          )}

          {canClear && (
            <button
              className="btn-danger-outline"
              onClick={() => {
                if (window.confirm('Clear all rounds and reset games-played counters?')) {
                  dispatch({ type: 'CLEAR_ROUNDS' })
                }
              }}
            >
              Clear Rounds
            </button>
          )}
        </div>
      </div>

      {/* ── Rounds ────────────────────────────────────────────────── */}
      {rounds.length > 0 ? (
        <ScheduleView rounds={rounds} scores={scores} dispatch={dispatch} />
      ) : (
        <div className="empty-schedule card">
          <p>No rounds yet. Configure breaks above, then hit <strong>Generate Round 1</strong>!</p>
        </div>
      )}
    </div>
  )
}
