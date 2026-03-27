export const DEFAULT_ELO = 1000
const ELO_K = 32

export const initialState = {
  sport: 'Beach Volleyball',
  playersPerTeam: 2,
  numFields: 2,
  players: [],
  // rounds: [{ id, matches, onBreak, sittingOut, gamesPlayedDelta }]
  rounds: [],
  scores: {}, // { [matchId]: { a, b, locked } }
  view: 'setup',
}

export function makePlayer(name, overrides = {}) {
  return {
    id: crypto.randomUUID(),
    name,
    elo: DEFAULT_ELO,
    gamesPlayed: 0,
    refuseList: [],
    acceptOnly: null,
    onBreak: false,
    ...overrides,
  }
}

/** Compute how much each player's gamesPlayed changes for a given round. */
function computeRoundDelta(round, totalPlayers) {
  const delta = {}
  round.matches.forEach(match => {
    ;[...match.teamA, ...match.teamB].forEach(p => {
      delta[p.id] = (delta[p.id] || 0) + 1
    })
  })
  if (round.onBreak?.length && totalPlayers > 0) {
    const playersOnFields = round.matches.reduce(
      (sum, m) => sum + m.teamA.length + m.teamB.length, 0
    )
    const credit = playersOnFields / totalPlayers
    round.onBreak.forEach(p => {
      delta[p.id] = (delta[p.id] || 0) + credit
    })
  }
  return delta
}

export function reducer(state, action) {
  switch (action.type) {
    case 'SET_CONFIG':
      return { ...state, ...action.payload }

    case 'ADD_PLAYER': {
      const player = makePlayer(action.payload.name, action.payload.overrides || {})
      return { ...state, players: [...state.players, player] }
    }

    case 'REMOVE_PLAYER': {
      const { id } = action.payload
      return {
        ...state,
        players: state.players
          .filter(p => p.id !== id)
          .map(p => ({
            ...p,
            refuseList: p.refuseList.filter(rid => rid !== id),
            acceptOnly: p.acceptOnly ? p.acceptOnly.filter(rid => rid !== id) : null,
          })),
      }
    }

    case 'CLEAR_PLAYERS':
      return { ...state, players: [], rounds: [], scores: {} }

    case 'UPDATE_PLAYER_ELO': {
      const { id, elo } = action.payload
      return {
        ...state,
        players: state.players.map(p =>
          p.id === id ? { ...p, elo: Math.max(0, Number(elo) || DEFAULT_ELO) } : p
        ),
      }
    }

    case 'UPDATE_PLAYER_PREFS': {
      const { id, refuseList, acceptOnly } = action.payload
      return {
        ...state,
        players: state.players.map(p =>
          p.id === id ? { ...p, refuseList, acceptOnly } : p
        ),
      }
    }

    case 'TOGGLE_PLAYER_BREAK': {
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.payload.id ? { ...p, onBreak: !p.onBreak } : p
        ),
      }
    }

    // Add a new round and immediately apply its gamesPlayed delta.
    case 'ADD_ROUND': {
      const newRoundData = action.payload
      const delta = computeRoundDelta(newRoundData, state.players.length)
      const newRound = { ...newRoundData, gamesPlayedDelta: delta }
      return {
        ...state,
        rounds: [...state.rounds, newRound],
        players: state.players.map(p => ({
          ...p,
          gamesPlayed: p.gamesPlayed + (delta[p.id] || 0),
        })),
      }
    }

    // Delete the last round entirely (only if it has no locked matches).
    // Reverses gamesPlayed delta so counters stay accurate.
    case 'REMOVE_LAST_ROUND': {
      if (state.rounds.length === 0) return state
      const lastRound = state.rounds[state.rounds.length - 1]
      const hasLocked = lastRound.matches.some(m => state.scores[m.id]?.locked)
      if (hasLocked) return state

      const oldDelta = lastRound.gamesPlayedDelta || {}
      const oldIds   = new Set(lastRound.matches.map(m => m.id))

      return {
        ...state,
        rounds: state.rounds.slice(0, -1),
        scores: Object.fromEntries(
          Object.entries(state.scores).filter(([id]) => !oldIds.has(id))
        ),
        players: state.players.map(p => ({
          ...p,
          gamesPlayed: p.gamesPlayed - (oldDelta[p.id] || 0),
        })),
      }
    }

    // Replace the last round (only if it has no locked matches).
    // Reverses the old delta and applies the new one.
    case 'REGENERATE_LAST_ROUND': {
      if (state.rounds.length === 0) return state
      const lastRound = state.rounds[state.rounds.length - 1]
      const hasLocked = lastRound.matches.some(m => state.scores[m.id]?.locked)
      if (hasLocked) return state

      const oldDelta = lastRound.gamesPlayedDelta || {}
      const newRoundData = action.payload
      const newDelta = computeRoundDelta(newRoundData, state.players.length)
      const newRound = { ...newRoundData, gamesPlayedDelta: newDelta }

      // Drop scores belonging to the old round
      const oldIds = new Set(lastRound.matches.map(m => m.id))
      const filteredScores = Object.fromEntries(
        Object.entries(state.scores).filter(([id]) => !oldIds.has(id))
      )

      return {
        ...state,
        rounds: [...state.rounds.slice(0, -1), newRound],
        scores: filteredScores,
        players: state.players.map(p => ({
          ...p,
          gamesPlayed: p.gamesPlayed - (oldDelta[p.id] || 0) + (newDelta[p.id] || 0),
        })),
      }
    }

    case 'CLEAR_ROUNDS':
      return {
        ...state,
        rounds: [],
        scores: {},
        players: state.players.map(p => ({ ...p, gamesPlayed: 0 })),
      }

    // Guard: locked scores are immutable.
    case 'SET_SCORE': {
      const { matchId, side, value } = action.payload
      const prev = state.scores[matchId] || { a: '', b: '' }
      if (prev.locked) return state
      return {
        ...state,
        scores: { ...state.scores, [matchId]: { ...prev, [side]: value } },
      }
    }

    // Lock a match score and update Elo for every player involved.
    case 'LOCK_SCORE': {
      const { matchId } = action.payload
      const score = state.scores[matchId]
      if (!score || score.locked || score.a === '' || score.b === '') return state

      // Find the match inside the rounds
      let match = null
      for (const round of state.rounds) {
        match = round.matches.find(m => m.id === matchId)
        if (match) break
      }
      if (!match) return state

      const aScore = Number(score.a)
      const bScore = Number(score.b)
      const SA = aScore > bScore ? 1 : aScore === bScore ? 0.5 : 0
      const SB = 1 - SA

      // Current Elo lookup
      const eloMap = Object.fromEntries(state.players.map(p => [p.id, p.elo]))
      const getElo = id => eloMap[id] ?? DEFAULT_ELO

      const teamAIds = match.teamA.map(p => p.id)
      const teamBIds = match.teamB.map(p => p.id)
      const avgEloA = teamAIds.reduce((s, id) => s + getElo(id), 0) / teamAIds.length
      const avgEloB = teamBIds.reduce((s, id) => s + getElo(id), 0) / teamBIds.length

      const eloUpdates = {}

      // Each player's expected score uses their individual Elo vs opponent team avg.
      teamAIds.forEach(id => {
        const expected = 1 / (1 + Math.pow(10, (avgEloB - getElo(id)) / 400))
        eloUpdates[id] = Math.round(getElo(id) + ELO_K * (SA - expected))
      })
      teamBIds.forEach(id => {
        const expected = 1 / (1 + Math.pow(10, (avgEloA - getElo(id)) / 400))
        eloUpdates[id] = Math.round(getElo(id) + ELO_K * (SB - expected))
      })

      return {
        ...state,
        scores: { ...state.scores, [matchId]: { ...score, locked: true } },
        players: state.players.map(p =>
          eloUpdates[p.id] !== undefined ? { ...p, elo: eloUpdates[p.id] } : p
        ),
      }
    }

    case 'SET_VIEW':
      return { ...state, view: action.payload }

    case 'RESET':
      return { ...initialState }

    default:
      return state
  }
}
