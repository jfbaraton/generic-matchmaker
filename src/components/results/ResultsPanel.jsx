import { useState } from 'react'
import './ResultsPanel.css'

/**
 * Derive per-player standings from rounds + scores.
 * gamesPlayed is taken from the live `players` array (which already includes
 * break-round fractional credits applied by the reducer).
 */
function deriveStandings(players, rounds, scores) {
  const stats = {}

  function ensure(player) {
    if (!stats[player.id]) {
      stats[player.id] = {
        id: player.id,
        name: player.name,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      }
    }
    return stats[player.id]
  }

  rounds.forEach(round => {
    round.matches.forEach(match => {
      const score = scores[match.id]
      if (!score || score.a === '' || score.b === '') return

      const aScore = Number(score.a)
      const bScore = Number(score.b)
      const aWins  = aScore > bScore
      const bWins  = bScore > aScore
      const draw   = aScore === bScore

      match.teamA.forEach(p => {
        const s = ensure(p)
        s.played++; s.goalsFor += aScore; s.goalsAgainst += bScore
        if (aWins)  { s.wins++;   s.points += 3 }
        else if (draw) { s.draws++; s.points += 1 }
        else         { s.losses++ }
      })

      match.teamB.forEach(p => {
        const s = ensure(p)
        s.played++; s.goalsFor += bScore; s.goalsAgainst += aScore
        if (bWins)  { s.wins++;   s.points += 3 }
        else if (draw) { s.draws++; s.points += 1 }
        else         { s.losses++ }
      })
    })
  })

  // Attach current Elo + gamesPlayed from live player state
  players.forEach(p => {
    if (stats[p.id]) {
      stats[p.id].elo        = p.elo
      stats[p.id].gamesPlayed = p.gamesPlayed
    }
  })

  return Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const gdA = a.goalsFor - a.goalsAgainst
    const gdB = b.goalsFor - b.goalsAgainst
    if (gdB !== gdA) return gdB - gdA
    return b.goalsFor - a.goalsFor
  })
}

/** Inline Elo editor cell */
function EloCell({ playerId, elo, dispatch }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState(elo)

  function commit() {
    const n = parseInt(val)
    if (!isNaN(n) && n >= 0) {
      dispatch({ type: 'UPDATE_PLAYER_ELO', payload: { id: playerId, elo: n } })
    } else {
      setVal(elo)
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <td className="elo-cell editing">
        <input
          type="number" min="0"
          className="elo-inline-input"
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setVal(elo); setEditing(false) } }}
          autoFocus
        />
      </td>
    )
  }
  return (
    <td
      className="elo-cell"
      title="Click to adjust Elo"
      onClick={() => { setVal(elo); setEditing(true) }}
    >
      ⭐ {elo}
    </td>
  )
}

export default function ResultsPanel({ players, rounds, scores, dispatch }) {
  const standings    = deriveStandings(players, rounds, scores)
  const totalMatches = rounds.reduce((sum, r) => sum + r.matches.length, 0)
  const scoredMatches = rounds.reduce((sum, r) =>
    sum + r.matches.filter(m => scores[m.id] && scores[m.id].a !== '' && scores[m.id].b !== '').length, 0)

  return (
    <div className="results-panel card">
      <h2 className="panel-title">🏆 Results & Standings</h2>
      <p className="panel-subtitle">
        {scoredMatches} / {totalMatches} matches scored · Click <strong>⭐ Elo</strong> to adjust after a round
      </p>

      {standings.length === 0 ? (
        <div className="empty-state">
          No scores entered yet.{' '}
          <button className="link-btn" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'schedule' })}>
            Go back to Schedule
          </button>{' '}
          and enter some scores!
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="standings-table">
            <thead>
              <tr>
                <th>#</th>
                <th className="th-left">Player</th>
                <th>GP</th>
                <th>W</th>
                <th>D</th>
                <th>L</th>
                <th>GF</th>
                <th>GA</th>
                <th>GD</th>
                <th>Pts</th>
                <th>Elo ✏️</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => (
                <tr key={s.id} className={i === 0 ? 'top-row' : ''}>
                  <td>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                  <td className="player-col">{s.name}</td>
                  <td className="gp-col">
                    {Number.isInteger(s.gamesPlayed)
                      ? s.gamesPlayed
                      : s.gamesPlayed?.toFixed(1) ?? '—'}
                  </td>
                  <td className="stat-win">{s.wins}</td>
                  <td>{s.draws}</td>
                  <td className="stat-loss">{s.losses}</td>
                  <td>{s.goalsFor}</td>
                  <td>{s.goalsAgainst}</td>
                  <td className={s.goalsFor - s.goalsAgainst >= 0 ? 'stat-win' : 'stat-loss'}>
                    {s.goalsFor - s.goalsAgainst > 0 ? '+' : ''}{s.goalsFor - s.goalsAgainst}
                  </td>
                  <td className="points-col">{s.points}</td>
                  <EloCell playerId={s.id} elo={s.elo ?? 1000} dispatch={dispatch} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="results-actions">
        <button className="btn-secondary" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'schedule' })}>
          ← Back to Schedule
        </button>
        <button
          className="btn-danger-outline"
          onClick={() => {
            if (window.confirm('Start over? This will reset everything.')) {
              dispatch({ type: 'RESET' })
            }
          }}
        >
          🔄 Start Over
        </button>
      </div>
    </div>
  )
}
