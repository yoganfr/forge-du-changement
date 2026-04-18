/**
 * Palette limitée à 5 teintes, choisies pour se distinguer nettement entre elles
 * et rester lisibles sur fond clair (cartes / pilules) — espacement régulier en teinte.
 * Au-delà de 5 projets, les couleurs sont réutilisées dans le même ordre.
 */
export const ROADMAP_PROJECT_PALETTE = [
  '#9D174D', // magenta / bordeaux soutenu
  '#1D4ED8', // bleu roi
  '#166534', // vert forêt
  '#C2410C', // orange brûlé
  '#5B21B6', // violet profond
] as const

/** Couleur par position dans la liste des projets roadmap (distincte jusqu’à 5 projets). */
export function assignRoadmapProjectColors(projectIdsInDisplayOrder: string[]): Record<string, string> {
  const m: Record<string, string> = {}
  const n = ROADMAP_PROJECT_PALETTE.length
  projectIdsInDisplayOrder.forEach((id, i) => {
    m[id] = ROADMAP_PROJECT_PALETTE[i % n]!
  })
  return m
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Fallback si l’id n’est pas dans la map d’assignation (ex. projet chargé hors ordre). */
export function getRoadmapProjectColorHex(projetId: string): string {
  const i = hashString(projetId) % ROADMAP_PROJECT_PALETTE.length
  return ROADMAP_PROJECT_PALETTE[i]!
}
