import { useState } from 'react'
import PlayerPrefsModal from './PlayerPrefsModal.jsx'
import './PlayerCard.css'

export default function PlayerCard({ player, allPlayers, dispatch }) {
  const [editingElo, setEditingElo] = useState(false)
  const [eloInput, setEloInput]     = useState(player.elo)
  const [showPrefs, setShowPrefs]   = useState(false)

  function commitElo() {
    const v = parseInt(eloInput)
    if (!isNaN(v) && v >= 0) {
      dispatch({ type: 'UPDATE_PLAYER_ELO', payload: { id: player.id, elo: v } })
    } else {
      setEloInput(player.elo)
    }
    setEditingElo(false)
  }

  function handleEloKey(e) {
    if (e.key === 'Enter') commitElo()
    if (e.key === 'Escape') { setEloInput(player.elo); setEditingElo(false) }
  }

  const hasPrefs = (player.refuseList?.length > 0) || (player.acceptOnly !== null)

  return (
    <>
      <div className={`player-card ${player.onBreak ? 'on-break' : ''}`}>
        {/* Top row: avatar + name + remove */}
        <div className="pc-top">
          <span className="player-avatar">{player.name[0]?.toUpperCase()}</span>
          <span className="player-name">{player.name}</span>
          <button
            className="remove-btn"
            onClick={() => dispatch({ type: 'REMOVE_PLAYER', payload: { id: player.id } })}
            title="Remove player"
          >×</button>
        </div>

        {/* Bottom row: Elo | GP | break | prefs */}
        <div className="pc-meta">
          {/* Elo */}
          {editingElo ? (
            <input
              className="elo-input"
              type="number"
              min="0"
              value={eloInput}
              onChange={e => setEloInput(e.target.value)}
              onBlur={commitElo}
              onKeyDown={handleEloKey}
              autoFocus
            />
          ) : (
            <button
              className="elo-badge"
              onClick={() => { setEloInput(player.elo); setEditingElo(true) }}
              title="Click to edit Elo"
            >
              ⭐ {player.elo}
            </button>
          )}

          {/* Games played */}
          <span className="gp-badge" title="Games played (break rounds count fractionally)">
            🎮 {Number.isInteger(player.gamesPlayed)
              ? player.gamesPlayed
              : player.gamesPlayed.toFixed(1)}
          </span>

          {/* Break toggle */}
          <button
            className={`icon-btn break-btn ${player.onBreak ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'TOGGLE_PLAYER_BREAK', payload: { id: player.id } })}
            title={player.onBreak ? 'End break' : 'Take a break this round'}
          >
            {player.onBreak ? '☕ Break' : '▶ Play'}
          </button>

          {/* Preferences */}
          <button
            className={`icon-btn prefs-btn ${hasPrefs ? 'active' : ''}`}
            onClick={() => setShowPrefs(true)}
            title="Partner preferences"
          >
            🤝{hasPrefs ? '!' : ''}
          </button>
        </div>
      </div>

      {showPrefs && (
        <PlayerPrefsModal
          player={player}
          allPlayers={allPlayers}
          onClose={() => setShowPrefs(false)}
          onSave={prefs => {
            dispatch({ type: 'UPDATE_PLAYER_PREFS', payload: { id: player.id, ...prefs } })
            setShowPrefs(false)
          }}
        />
      )}
    </>
  )
}
