import './PlayerCard.css'

export default function PlayerCard({ player, onRemove }) {
  return (
    <div className="player-card">
      <span className="player-avatar">{player.name[0]?.toUpperCase()}</span>
      <span className="player-name">{player.name}</span>
      <button className="remove-btn" onClick={onRemove} title="Remove player">×</button>
    </div>
  )
}

