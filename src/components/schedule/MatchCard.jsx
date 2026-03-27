import './MatchCard.css'

export default function MatchCard({ match, score, dispatch }) {
  const { id, field, teamA, teamB } = match

  function handleScore(side, value) {
    dispatch({ type: 'SET_SCORE', payload: { matchId: id, side, value } })
  }

  const aScore = score.a === '' ? '' : Number(score.a)
  const bScore = score.b === '' ? '' : Number(score.b)
  const played = aScore !== '' && bScore !== ''
  const aWins = played && aScore > bScore
  const bWins = played && bScore > aScore
  const draw = played && aScore === bScore

  return (
    <div className={`match-card ${played ? (draw ? 'draw' : 'played') : ''}`}>
      <div className="match-field-label">{field}</div>

      <div className="match-teams">
        {/* Team A */}
        <div className={`team ${aWins ? 'winner' : ''}`}>
          <div className="team-label">Team A</div>
          <div className="team-players">
            {teamA.map(p => (
              <span key={p.id} className="team-player">{p.name}</span>
            ))}
          </div>
        </div>

        {/* Score inputs */}
        <div className="score-block">
          <input
            type="number"
            min="0"
            className={`score-input ${aWins ? 'score-win' : bWins ? 'score-lose' : ''}`}
            value={score.a}
            onChange={e => handleScore('a', e.target.value)}
            placeholder="—"
          />
          <span className="score-vs">vs</span>
          <input
            type="number"
            min="0"
            className={`score-input ${bWins ? 'score-win' : aWins ? 'score-lose' : ''}`}
            value={score.b}
            onChange={e => handleScore('b', e.target.value)}
            placeholder="—"
          />
        </div>

        {/* Team B */}
        <div className={`team team-right ${bWins ? 'winner' : ''}`}>
          <div className="team-label">Team B</div>
          <div className="team-players">
            {teamB.map(p => (
              <span key={p.id} className="team-player">{p.name}</span>
            ))}
          </div>
        </div>
      </div>

      {played && (
        <div className="match-result-badge">
          {draw ? '🤝 Draw' : `🏆 Team ${aWins ? 'A' : 'B'} wins`}
        </div>
      )}
    </div>
  )
}

