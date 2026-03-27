import { useReducer, useEffect } from 'react'
import { reducer, initialState, DEFAULT_ELO } from './state/reducer.js'
import NavBar from './components/layout/NavBar.jsx'
import SetupPanel from './components/setup/SetupPanel.jsx'
import PlayerPool from './components/players/PlayerPool.jsx'
import SchedulePanel from './components/schedule/SchedulePanel.jsx'
import ResultsPanel from './components/results/ResultsPanel.jsx'

const STORAGE_KEY = 'matchmaker-state'

function migratePlayer(p) {
  return {
    elo: DEFAULT_ELO,
    gamesPlayed: 0,
    refuseList: [],
    acceptOnly: null,
    onBreak: false,
    ...p,
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const saved = JSON.parse(raw)

    // Migrate old flat matches[] → rounds[]
    if (saved.matches && !saved.rounds) {
      saved.rounds = []
      delete saved.matches
    }
    // Ensure new player fields exist
    if (saved.players) {
      saved.players = saved.players.map(migratePlayer)
    }
    return { ...initialState, ...saved }
  } catch {
    return initialState
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  // Persist state to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const { sport, playersPerTeam, numFields, players, rounds, scores, view } = state

  const minPlayers = playersPerTeam * 2
  const canAdvancePlayers = players.length >= minPlayers
  const hasSchedule = rounds.length > 0

  function renderView() {
    switch (view) {
      case 'setup':
        return (
          <SetupPanel
            sport={sport}
            playersPerTeam={playersPerTeam}
            numFields={numFields}
            dispatch={dispatch}
          />
        )
      case 'players':
        return (
          <PlayerPool
            players={players}
            playersPerTeam={playersPerTeam}
            sport={sport}
            dispatch={dispatch}
          />
        )
      case 'schedule':
        return (
          <SchedulePanel
            players={players}
            playersPerTeam={playersPerTeam}
            numFields={numFields}
            sport={sport}
            rounds={rounds}
            scores={scores}
            dispatch={dispatch}
          />
        )
      case 'results':
        return (
          <ResultsPanel
            players={players}
            rounds={rounds}
            scores={scores}
            dispatch={dispatch}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      <NavBar
        view={view}
        dispatch={dispatch}
        canAdvancePlayers={canAdvancePlayers}
        hasSchedule={hasSchedule}
      />
      <main className="app-main">
        {renderView()}
      </main>
    </>
  )
}
