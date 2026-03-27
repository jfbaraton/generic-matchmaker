import './MatchCard.css'

function avgElo(team) {
  if (!team?.length) return null
  return Math.round(team.reduce((s, p) => s + (p.elo ?? 1000), 0) / team.length)
}

export default function MatchCard({ match, score, dispatch }) {
  const { id, field, teamA, teamB } = match

  const aVal    = score.a === '' ? '' : Number(score.a)
  const bVal    = score.b === '' ? '' : Number(score.b)
  const locked  = !!score.locked
  const complete = aVal !== '' && bVal !== ''
  const aWins   = complete && aVal > bVal
  const bWins   = complete && bVal > aVal
  const draw    = complete && aVal === bVal

  const eloA = avgElo(teamA)
  const eloB = avgElo(teamB)

  function handleScore(side, value) {
    if (locked) return
    dispatch({ type: 'SET_SCORE', payload: { matchId: id, side, value } })
  }

  function handleLock() {
    if (!complete || locked) return
    dispatch({ type: 'LOCK_SCORE', payload: { matchId: id } })
  }

  return (
    <div className={`match-card ${locked ? (draw ? 'draw locked' : 'played locked') : complete ? (draw ? 'draw' : 'played') : ''}`}>
      <div className="match-field-label">
        {field}
        {locked && <span className="lock-badge">🔒 Locked</span>}
      </div>

      <div className="match-teams">
        {/* Team A */}
        <div className={`team ${aWins ? 'winner' : ''}`}>
          <div className="team-label">
            Team A {eloA !== null && <span className="team-elo">⭐{eloA}</span>}
          </div>
          <div className="team-players">
            {teamA.map(p => (
              <span key={p.id} className="team-player">{p.name}</span>
            ))}
          </div>
        </div>

        {/* Score */}
        <div className="score-block">
          {locked ? (
            <>
              <span className={`score-static ${aWins ? 'score-win' : bWins ? 'score-lose' : ''}`}>
                {aVal}
              </span>
              <span className="score-vs">vs</span>
              <span className={`score-static ${bWins ? 'score-win' : aWins ? 'score-lose' : ''}`}>
                {bVal}
              </span>
            </>
          ) : (
            <>
              <input
                type="number" min="0"
                className={`score-input ${aWins ? 'score-win' : bWins ? 'score-lose' : ''}`}
                value={score.a}
                onChange={e => handleScore('a', e.target.value)}
                placeholder="—"
              />
              <span className="score-vs">vs</span>
              <input
                type="number" min="0"
                className={`score-input ${bWins ? 'score-win' : aWins ? 'score-lose' : ''}`}
                value={score.b}
                onChange={e => handleScore('b', e.target.value)}
                placeholder="—"
              />
            </>
          )}
        </div>

        {/* Team B */}
        <div className={`team team-right ${bWins ? 'winner' : ''}`}>
          <div className="team-label">
            {eloB !== null && <span className="team-elo">⭐{eloB}</span>} Team B
          </div>
          <div className="team-players">
            {teamB.map(p => (
              <span key={p.id} className="team-player">{p.name}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Result + confirm */}
      {complete && (
        <div className="match-footer">
          <span className="match-result-badge">
            {draw ? '🤝 Draw' : `🏆 Team ${aWins ? 'A' : 'B'} wins`}
          </span>
          {!locked && (
            <button className="confirm-btn" onClick={handleLock} title="Lock score and update Elo">
              ✅ Confirm & update Elo
            </button>
          )}
        </div>
      )}
    </div>
  )
}
