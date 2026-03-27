import MatchCard from './MatchCard.jsx'
import './ScheduleView.css'

export default function ScheduleView({ rounds, scores, dispatch }) {
  return (
    <div className="schedule-view">
      {rounds.map((round, roundIdx) => {
        const allSitting = [...(round.onBreak || []), ...(round.sittingOut || [])]
        return (
          <div key={round.id ?? roundIdx} className="round-section">
            <div className="round-header">
              <h3 className="round-title">Round {roundIdx + 1}</h3>
              {allSitting.length > 0 && (
                <div className="round-sitting">
                  {round.onBreak?.length > 0 && (
                    <span className="sitting-group">
                      ☕ Break: {round.onBreak.map(p => p.name).join(', ')}
                    </span>
                  )}
                  {round.sittingOut?.length > 0 && (
                    <span className="sitting-group sitting-out">
                      🪑 Sitting out: {round.sittingOut.map(p => p.name).join(', ')}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="round-grid">
              {round.matches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  score={scores[match.id] || { a: '', b: '' }}
                  dispatch={dispatch}
                />
              ))}
              {round.matches.length === 0 && (
                <div className="no-matches">No matches this round.</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
