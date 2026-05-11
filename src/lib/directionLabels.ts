/** Comparaison tolérante des libellés de directions (casse, espaces, article français). */

export function normalizeDirectionComparisonKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function directionDisplayNamesMatch(userLabel: string, directionNom: string): boolean {
  const a = normalizeDirectionComparisonKey(userLabel)
  const b = normalizeDirectionComparisonKey(directionNom)
  if (a === b) return true
  const strip = (x: string) => x.replace(/^(la|le|l')\s+/i, '').trim()
  return strip(a) === strip(b)
}
