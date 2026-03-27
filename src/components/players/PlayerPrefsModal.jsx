import { useState } from 'react'
import './PlayerPrefsModal.css'

/**
 * Modal to configure a player's partner preferences.
 *
 * Modes:
 *  "all"      – play with anyone (refuseList may still have specific bans)
 *  "acceptOnly" – whitelist: only play with selected partners
 *
 * Both modes allow a separate "refuse" blacklist.
 */
export default function PlayerPrefsModal({ player, allPlayers, onSave, onClose }) {
  const others = allPlayers.filter(p => p.id !== player.id)

  const [mode, setMode] = useState(player.acceptOnly ? 'acceptOnly' : 'all')
  const [acceptOnly, setAcceptOnly] = useState(new Set(player.acceptOnly ?? []))
  const [refuseList, setRefuseList] = useState(new Set(player.refuseList ?? []))

  function toggleAccept(id) {
    setAcceptOnly(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function toggleRefuse(id) {
    setRefuseList(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function handleSave() {
    onSave({
      refuseList: [...refuseList],
      acceptOnly: mode === 'acceptOnly' ? [...acceptOnly] : null,
    })
  }

  const nameOf = id => allPlayers.find(p => p.id === id)?.name ?? id

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true">
        <div className="modal-header">
          <span className="modal-avatar">{player.name[0]?.toUpperCase()}</span>
          <h3 className="modal-title">{player.name} — Partner Preferences</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {others.length === 0 ? (
          <p className="modal-empty">No other players to configure.</p>
        ) : (
          <>
            {/* ── Mode selector ─────────────────────────────────────── */}
            <div className="pref-section">
              <div className="pref-label">Can play with</div>
              <div className="pref-mode-row">
                <label className={`pref-radio ${mode === 'all' ? 'selected' : ''}`}>
                  <input type="radio" name="mode" value="all" checked={mode === 'all'}
                    onChange={() => setMode('all')} />
                  🌍 Anyone
                </label>
                <label className={`pref-radio ${mode === 'acceptOnly' ? 'selected' : ''}`}>
                  <input type="radio" name="mode" value="acceptOnly" checked={mode === 'acceptOnly'}
                    onChange={() => setMode('acceptOnly')} />
                  ✅ Only these partners…
                </label>
              </div>

              {mode === 'acceptOnly' && (
                <div className="pref-checklist">
                  {others.map(p => (
                    <label key={p.id} className={`pref-check ${acceptOnly.has(p.id) ? 'checked' : ''}`}>
                      <input type="checkbox" checked={acceptOnly.has(p.id)}
                        onChange={() => toggleAccept(p.id)} />
                      <span className="check-avatar">{p.name[0]?.toUpperCase()}</span>
                      {p.name}
                    </label>
                  ))}
                  {acceptOnly.size === 0 && (
                    <p className="pref-hint">⚠️ No partners selected — this player will always sit out.</p>
                  )}
                </div>
              )}
            </div>

            {/* ── Refuse list ───────────────────────────────────────── */}
            <div className="pref-section">
              <div className="pref-label">Won't play with</div>
              <div className="pref-checklist">
                {others.map(p => (
                  <label key={p.id} className={`pref-check ${refuseList.has(p.id) ? 'checked refuse' : ''}`}>
                    <input type="checkbox" checked={refuseList.has(p.id)}
                      onChange={() => toggleRefuse(p.id)} />
                    <span className="check-avatar">{p.name[0]?.toUpperCase()}</span>
                    {p.name}
                  </label>
                ))}
              </div>
              {refuseList.size > 0 && (
                <p className="pref-hint">
                  ⛔ Refuses: {[...refuseList].map(nameOf).join(', ')}
                </p>
              )}
            </div>
          </>
        )}

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save Preferences</button>
        </div>
      </div>
    </div>
  )
}

