/** Chaîne comparable pour détecter des doublons de directions. */
export function normalizeDirectionLabel(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

/** Distance d’édition (petites chaînes uniquement, usage métier). */
export function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i]![0] = i
  for (let j = 0; j <= n; j++) dp[0]![j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost,
      )
    }
  }
  return dp[m]![n]!
}

export type DirectionLike = { id: string; nom: string }

/**
 * Retourne une direction existante si l’intitulé est identique, très proche,
 * ou si l’un contient l’autre (après normalisation).
 */
export function findSimilarDirection<T extends DirectionLike>(label: string, directions: T[]): T | null {
  const n = normalizeDirectionLabel(label)
  if (!n) return null
  let best: T | null = null
  let bestDist = Infinity
  for (const d of directions) {
    const dn = normalizeDirectionLabel(d.nom)
    if (!dn) continue
    if (dn === n) return d
    if (dn.includes(n) || n.includes(dn)) return d
    const maxLen = Math.max(n.length, dn.length)
    if (maxLen < 3) continue
    const dist = levenshtein(n, dn)
    const threshold = Math.min(2, Math.max(1, Math.floor(maxLen / 8)))
    if (dist <= threshold && dist < bestDist) {
      bestDist = dist
      best = d
    }
  }
  return best
}
