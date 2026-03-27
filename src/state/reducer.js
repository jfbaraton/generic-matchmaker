export const initialState = {
  sport: 'Beach Volleyball',
  playersPerTeam: 2,
  numFields: 2,
  players: [],
  matches: [], // array of rounds: each round = [{ id, field, teamA[], teamB[] }]
  scores: {},  // { matchId: { a: number|'', b: number|'' } }
  view: 'setup', // 'setup' | 'players' | 'schedule' | 'results'
}

export function reducer(state, action) {
  switch (action.type) {
    case 'SET_CONFIG':
      return { ...state, ...action.payload }

    case 'ADD_PLAYER': {
      const id = crypto.randomUUID()
      return { ...state, players: [...state.players, { id, name: action.payload.name }] }
    }

    case 'REMOVE_PLAYER':
      return { ...state, players: state.players.filter(p => p.id !== action.payload.id) }

    case 'CLEAR_PLAYERS':
      return { ...state, players: [] }

    case 'SET_MATCHES':
      return { ...state, matches: action.payload, scores: {} }

    case 'SET_SCORE': {
      const { matchId, side, value } = action.payload
      const prev = state.scores[matchId] || { a: '', b: '' }
      return {
        ...state,
        scores: {
          ...state.scores,
          [matchId]: { ...prev, [side]: value },
        },
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

