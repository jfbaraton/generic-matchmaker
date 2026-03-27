import MatchCard from './MatchCard.jsx'
import './ScheduleView.css'

export default function ScheduleView({ matches, scores, dispatch }) {
  return (
    <div className="schedule-view">
      {matches.map((round, roundIdx) => (
        <div key={roundIdx} className="round-section">
          <h3 className="round-title">Round {roundIdx + 1}</h3>
          <div className="round-grid">
            {round.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                score={scores[match.id] || { a: '', b: '' }}
                dispatch={dispatch}
              />
            ))}
            {round.length === 0 && (
              <div className="no-matches">No matches this round (check player count vs field count)</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

