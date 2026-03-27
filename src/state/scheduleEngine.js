/**
 * Fisher-Yates shuffle.
 */
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Split a flat array into chunks of `size`. Leftover elements are dropped.
 */
function chunkTeams(players, size) {
  const teams = []
  for (let i = 0; i + size <= players.length; i += size) {
    teams.push(players.slice(i, i + size))
  }
  return teams
}

/**
 * Average Elo of a team.
 */
function teamAvgElo(team) {
  if (!team.length) return 0
  return team.reduce((s, p) => s + p.elo, 0) / team.length
}

/**
 * Elo spread (max − min) inside a team.
 */
function teamEloSpread(team) {
  if (team.length <= 1) return 0
  const elos = team.map(p => p.elo)
  return Math.max(...elos) - Math.min(...elos)
}

/**
 * Return true if any two players in the same team violate each other's preferences.
 *  - refuseList: player explicitly refuses to play with the other
 *  - acceptOnly:  player only accepts specific partners; everyone else is refused
 */
function hasPreferenceViolation(teams) {
  for (const team of teams) {
    for (let i = 0; i < team.length; i++) {
      for (let j = i + 1; j < team.length; j++) {
        const a = team[i], b = team[j]
        if (a.refuseList?.includes(b.id)) return true
        if (b.refuseList?.includes(a.id)) return true
        if (a.acceptOnly && !a.acceptOnly.includes(b.id)) return true
        if (b.acceptOnly && !b.acceptOnly.includes(a.id)) return true
      }
    }
  }
  return false
}

/**
 * Score a candidate team assignment (higher = better).
 * `playerOrder` is a flat array; teams are formed by chunking.
 *
 * Priority (as weighted penalty):
 *   1. Preference violations → −1 000 000 (hard)
 *   2. Elo balance between opponent teams (constraint 3)
 *   3. Elo spread within each team (constraint 4)
 *
 * Note: constraint 2 (games-played spread) is handled before calling this
 * function by greedily selecting which players sit out.
 */
function scoreTeamAssignment(playerOrder, playersPerTeam) {
  const teams = chunkTeams(playerOrder, playersPerTeam)

  if (hasPreferenceViolation(teams)) return -1_000_000

  let score = 0
  for (let i = 0; i + 1 < teams.length; i += 2) {
    const tA = teams[i], tB = teams[i + 1]
    // Constraint 3: minimise Elo difference between opponents (weight 10)
    score -= Math.abs(teamAvgElo(tA) - teamAvgElo(tB)) * 10
    // Constraint 4: minimise Elo spread within each team (weight 1)
    score -= teamEloSpread(tA)
    score -= teamEloSpread(tB)
  }
  return score
}

/**
 * Generate the next round using constraint-based optimisation.
 *
 * Constraint priority:
 *  1. Player preference violations (hard) — respected during team search
 *  2. Games-played spread — handled greedily (fewest-played play first)
 *  3. Elo balance between teams — optimised via hill-climbing
 *  4. Elo spread within teams — optimised via hill-climbing
 *
 * Returns { matches, onBreak, sittingOut }
 *   • onBreak   – players who chose to break this round
 *   • sittingOut – active players who couldn't fit on a field
 */
export function generateNextRound(players, playersPerTeam, numFields) {
  const breakPlayers  = players.filter(p => p.onBreak)
  const activePlayers = players.filter(p => !p.onBreak)

  const matchSize      = playersPerTeam * 2          // players per match
  const slotsAvailable = numFields * matchSize        // maximum players on fields

  // Largest number of active players that fills complete matches within field capacity
  const usableCount = Math.min(
    Math.floor(activePlayers.length / matchSize) * matchSize,
    Math.floor(slotsAvailable    / matchSize) * matchSize,
  )

  if (usableCount < matchSize) {
    // Not enough players for even one match
    return { matches: [], onBreak: breakPlayers, sittingOut: activePlayers }
  }

  // ── Constraint 2: play those with fewest gamesPlayed first ──────────────
  // When some active players must sit out, randomise among those tied at the
  // boundary gamesPlayed value so re-rolls can rotate who sits out.
  const sortedActive = [...activePlayers].sort((a, b) => a.gamesPlayed - b.gamesPlayed)
  let playing, sittingOut

  const extraSitters = activePlayers.length - usableCount
  if (extraSitters > 0) {
    const boundaryGP = sortedActive[usableCount - 1].gamesPlayed
    const clearPlay  = sortedActive.filter(p => p.gamesPlayed < boundaryGP)
    const boundary   = shuffle(sortedActive.filter(p => p.gamesPlayed === boundaryGP))
    const clearSit   = sortedActive.filter(p => p.gamesPlayed > boundaryGP)
    const slotsLeft  = usableCount - clearPlay.length
    playing    = [...clearPlay, ...boundary.slice(0, slotsLeft)]
    sittingOut = [...boundary.slice(slotsLeft), ...clearSit]
  } else {
    playing    = sortedActive.slice(0, usableCount)
    sittingOut = []
  }

  // ── Constraints 3 & 4: hill-climb over team assignments ─────────────────
  const RESTARTS         = 12
  const ITERS_PER_RESTART = 600

  let bestOrder = shuffle(playing)
  let bestScore = scoreTeamAssignment(bestOrder, playersPerTeam)

  for (let r = 0; r < RESTARTS; r++) {
    let cur      = shuffle(playing)
    let curScore = scoreTeamAssignment(cur, playersPerTeam)

    for (let iter = 0; iter < ITERS_PER_RESTART; iter++) {
      const cand = [...cur]
      const i = Math.floor(Math.random() * usableCount)
      const j = Math.floor(Math.random() * usableCount)
      if (i === j) continue
      ;[cand[i], cand[j]] = [cand[j], cand[i]]
      const s = scoreTeamAssignment(cand, playersPerTeam)
      if (s >= curScore) { cur = cand; curScore = s }
    }

    if (curScore > bestScore) { bestScore = curScore; bestOrder = cur }

    // Early exit if we found a perfect (preference-valid) solution
    if (bestScore > -1_000_000 && bestScore >= -0.01) break
  }

  // ── Build match objects ──────────────────────────────────────────────────
  const teams      = chunkTeams(bestOrder, playersPerTeam)
  const numMatches = Math.min(numFields, Math.floor(teams.length / 2))
  const matches    = []

  for (let i = 0; i < numMatches; i++) {
    matches.push({
      id:    crypto.randomUUID(),
      field: `Field ${i + 1}`,
      teamA: teams[i * 2],
      teamB: teams[i * 2 + 1],
    })
  }

  return { matches, onBreak: breakPlayers, sittingOut }
}

/**
 * Canonical key for a team: sorted player IDs joined.
 * Independent of the order players appear in the array.
 */
function teamKey(team) {
  return [...team.map(p => p.id)].sort().join('|')
}

/**
 * Return true when two rounds produce the exact same collection of teams
 * (ignoring which field they're on and which side, A or B, they occupy).
 */
export function sameTeamComposition(roundA, roundB) {
  const keysA = roundA.matches.flatMap(m => [teamKey(m.teamA), teamKey(m.teamB)]).sort()
  const keysB = roundB.matches.flatMap(m => [teamKey(m.teamA), teamKey(m.teamB)]).sort()
  return keysA.length === keysB.length && keysA.every((k, i) => k === keysB[i])
}

