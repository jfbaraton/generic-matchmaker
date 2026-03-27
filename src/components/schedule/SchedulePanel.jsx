import { useState } from 'react'
import { generateRoundRobin, generateRandom } from '../../state/scheduleEngine.js'
import ScheduleView from './ScheduleView.jsx'
import './SchedulePanel.css'

export default function SchedulePanel({ players, playersPerTeam, numFields, sport, matches, scores, dispatch }) {
  const [mode, setMode] = useState('roundrobin')
  const [numRounds, setNumRounds] = useState(3)

  function handleGenerate() {
    let rounds
    if (mode === 'roundrobin') {
      rounds = generateRoundRobin(players, playersPerTeam, numFields)
    } else {
      rounds = generateRandom(players, playersPerTeam, numFields, parseInt(numRounds) || 3)
    }
    dispatch({ type: 'SET_MATCHES', payload: rounds })
  }

  return (
    <div className="schedule-panel">
      <div className="card schedule-controls">
        <h2 className="panel-title">📅 Schedule Generator</h2>
        <p className="panel-subtitle">
          {sport} · {players.length} players · {playersPerTeam}/team · {numFields} field{numFields !== 1 ? 's' : ''}
        </p>

        <div className="mode-toggle">
          <label className={`mode-option ${mode === 'roundrobin' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="mode"
              value="roundrobin"
              checked={mode === 'roundrobin'}
              onChange={() => setMode('roundrobin')}
            />
            🔄 Round-Robin
          </label>
          <label className={`mode-option ${mode === 'random' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="mode"
              value="random"
              checked={mode === 'random'}
              onChange={() => setMode('random')}
            />
            🎲 Random
          </label>
        </div>

        {mode === 'random' && (
          <div className="form-group rounds-input">
            <label htmlFor="numRounds">Number of rounds</label>
            <input
              id="numRounds"
              type="number"
              min="1"
              max="20"
              value={numRounds}
              onChange={e => setNumRounds(e.target.value)}
              style={{ width: '80px' }}
            />
          </div>
        )}

        <div className="controls-actions">
          <button className="btn-primary" onClick={handleGenerate}>
            ⚡ Generate Schedule
          </button>
          {matches.length > 0 && (
            <button
              className="btn-secondary"
              onClick={() => dispatch({ type: 'SET_VIEW', payload: 'results' })}
            >
              View Results 🏆
            </button>
          )}
        </div>
      </div>

      {matches.length > 0 ? (
        <ScheduleView matches={matches} scores={scores} dispatch={dispatch} />
      ) : (
        <div className="empty-schedule card">
          <p>No schedule yet. Hit <strong>Generate Schedule</strong> above!</p>
        </div>
      )}
    </div>
  )
}

