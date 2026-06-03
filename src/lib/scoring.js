export function calcPoints(tip, result, odds = 1.0, options = {}) {
  const { isMatchOfDay = false, hasMomentum = false } = options
  const BASE = 10

  if (!result) return 0

  const tipTendency = getTendency(tip.home, tip.away)
  const resultTendency = getTendency(result.home, result.away)
  const isExact = tip.home === result.home && tip.away === result.away
  const isCorrect = tipTendency === resultTendency

  let points = 0
  if (isExact) points = BASE * odds * 2
  else if (isCorrect) points = BASE * odds
  else points = 0

  // Power-ups (stacked in order)
  if (tip.joker) points *= 2
  if (tip.allIn) points = isCorrect ? points * 4 : -25
  if (!isCorrect && tip.insurance && !tip.allIn) points = -(BASE / 2)
  if (isMatchOfDay) points *= 2
  if (isCorrect && hasMomentum && !tip.allIn) points *= 1.5

  return Math.round(points * 100) / 100
}

export function getTendency(home, away) {
  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}
