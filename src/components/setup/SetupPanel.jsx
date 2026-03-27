import { useState } from 'react'
import './SetupPanel.css'

export default function SetupPanel({ sport, playersPerTeam, numFields, dispatch }) {
  const [localSport, setLocalSport] = useState(sport)
  const [localPPT, setLocalPPT] = useState(playersPerTeam)
  const [localFields, setLocalFields] = useState(numFields)

  function handleSave(e) {
    e.preventDefault()
    if (!localSport.trim()) return
    dispatch({
      type: 'SET_CONFIG',
      payload: {
        sport: localSport.trim(),
        playersPerTeam: Math.max(1, parseInt(localPPT) || 1),
        numFields: Math.max(1, parseInt(localFields) || 1),
      },
    })
    dispatch({ type: 'SET_VIEW', payload: 'players' })
  }

  return (
    <div className="setup-panel card">
      <h2 className="panel-title">⚙️ Match Setup</h2>
      <p className="panel-subtitle">Configure your event before adding players.</p>

      <form className="setup-form" onSubmit={handleSave}>
        <div className="form-group">
          <label htmlFor="sport">Sport / Game</label>
          <input
            id="sport"
            type="text"
            value={localSport}
            onChange={e => setLocalSport(e.target.value)}
            placeholder="e.g. Soccer, Basketball, Padel…"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ppt">Players per team</label>
            <input
              id="ppt"
              type="number"
              min="1"
              max="50"
              value={localPPT}
              onChange={e => setLocalPPT(e.target.value)}
            />
            <span className="hint">Each team will have this many players.</span>
          </div>

          <div className="form-group">
            <label htmlFor="fields">Number of fields</label>
            <input
              id="fields"
              type="number"
              min="1"
              max="20"
              value={localFields}
              onChange={e => setLocalFields(e.target.value)}
            />
            <span className="hint">Matches run simultaneously on each field.</span>
          </div>
        </div>

        <div className="info-box">
          <strong>Minimum players needed:</strong>{' '}
          {Math.max(1, parseInt(localPPT) || 1) * 2} (for 1 match)
        </div>

        <button className="btn-primary" type="submit">
          Save & Continue →
        </button>
      </form>
    </div>
  )
}

