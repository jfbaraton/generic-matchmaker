import { useState } from 'react'
import PlayerCard from './PlayerCard.jsx'
import './PlayerPool.css'

export default function PlayerPool({ players, playersPerTeam, sport, dispatch }) {
  const [name, setName] = useState('')
  const minPlayers = playersPerTeam * 2

  function handleAdd(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    dispatch({ type: 'ADD_PLAYER', payload: { name: trimmed } })
    setName('')
  }

  function handleBulkAdd() {
    const raw = window.prompt(
      'Paste player names, one per line or comma-separated:'
    )
    if (!raw) return
    const names = raw
      .split(/[\n,]+/)
      .map(n => n.trim())
      .filter(Boolean)
    names.forEach(n => dispatch({ type: 'ADD_PLAYER', payload: { name: n } }))
  }

  const ready = players.length >= minPlayers
  const teamsCount = Math.floor(players.length / playersPerTeam)
  const sittingOut = players.length % playersPerTeam

  return (
    <div className="player-pool card">
      <h2 className="panel-title">👥 Player Pool</h2>
      <p className="panel-subtitle">
        Sport: <strong>{sport}</strong> · {playersPerTeam} players/team
      </p>

      <form className="add-form" onSubmit={handleAdd}>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Player name…"
          className="name-input"
        />
        <button className="btn-primary" type="submit">Add</button>
        <button className="btn-secondary" type="button" onClick={handleBulkAdd}>
          Bulk Add
        </button>
      </form>

      <div className="pool-stats">
        <span className={`stat ${ready ? 'stat-ok' : 'stat-warn'}`}>
          {players.length} player{players.length !== 1 ? 's' : ''}
        </span>
        {players.length > 0 && (
          <>
            <span className="stat">→ {teamsCount} team{teamsCount !== 1 ? 's' : ''}</span>
            {sittingOut > 0 && (
              <span className="stat stat-warn">{sittingOut} sitting out</span>
            )}
          </>
        )}
        {!ready && (
          <span className="stat stat-warn">
            Need {minPlayers - players.length} more to start
          </span>
        )}
      </div>

      {players.length > 0 ? (
        <div className="player-grid">
          {players.map(p => (
            <PlayerCard
              key={p.id}
              player={p}
              onRemove={() => dispatch({ type: 'REMOVE_PLAYER', payload: { id: p.id } })}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">No players yet. Add some above! 👆</div>
      )}

      {players.length > 0 && (
        <div className="pool-actions">
          <button
            className="btn-danger-outline"
            onClick={() => {
              if (window.confirm('Remove all players?')) {
                dispatch({ type: 'CLEAR_PLAYERS' })
              }
            }}
          >
            Clear All
          </button>
          <button
            className="btn-primary"
            disabled={!ready}
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'schedule' })}
          >
            Generate Schedule →
          </button>
        </div>
      )}
    </div>
  )
}

