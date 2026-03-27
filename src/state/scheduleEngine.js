/**
 * Shuffle an array in-place using Fisher-Yates.
 */
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Split a flat player array into chunks of size `size`.
 * Any leftover players are dropped (they sit out).
 */
function chunkTeams(players, size) {
  const teams = []
  for (let i = 0; i + size <= players.length; i += size) {
    teams.push(players.slice(i, i + size))
  }
  return teams
}

/**
 * Pair teams into matches.
 * Returns array of { teamA, teamB }.
 */
function pairTeams(teams) {
  const pairs = []
  for (let i = 0; i + 1 < teams.length; i += 2) {
    pairs.push({ teamA: teams[i], teamB: teams[i + 1] })
  }
  return pairs
}

/**
 * Assign matches to fields in a single round.
 * Returns matches with a `field` label and unique `id`.
 */
function assignToFields(pairs, numFields) {
  return pairs.slice(0, numFields).map((pair, idx) => ({
    id: crypto.randomUUID(),
    field: `Field ${idx + 1}`,
    ...pair,
  }))
}

/**
 * Generate a round-robin schedule.
 * Uses the circle method for even number of teams; adds a bye for odd.
 * Returns array of rounds. Each round = array of match objects.
 */
export function generateRoundRobin(players, playersPerTeam, numFields) {
  // Divide players into named teams for this schedule
  const allPlayers = [...players]
  const teams = chunkTeams(allPlayers, playersPerTeam)

  if (teams.length < 2) return []

  // Add a "bye" team if odd number of teams
  const t = teams.length % 2 === 0 ? [...teams] : [...teams, null]
  const n = t.length
  const rounds = []

  const fixed = t[0]
  const rotating = t.slice(1)

  for (let r = 0; r < n - 1; r++) {
    const current = [fixed, ...rotating]
    const pairs = []
    for (let i = 0; i < n / 2; i++) {
      const home = current[i]
      const away = current[n - 1 - i]
      if (home !== null && away !== null) {
        pairs.push({ teamA: home, teamB: away })
      }
    }
    rounds.push(assignToFields(pairs, numFields))
    // Rotate: move last element of rotating to front
    rotating.unshift(rotating.pop())
  }

  return rounds
}

/**
 * Generate a random schedule for `numRounds` rounds.
 * Each round shuffles the player pool and creates fresh matchups.
 */
export function generateRandom(players, playersPerTeam, numFields, numRounds = 3) {
  const rounds = []
  for (let r = 0; r < numRounds; r++) {
    const shuffled = shuffle(players)
    const teams = chunkTeams(shuffled, playersPerTeam)
    const pairs = pairTeams(teams)
    rounds.push(assignToFields(pairs, numFields))
  }
  return rounds
}

