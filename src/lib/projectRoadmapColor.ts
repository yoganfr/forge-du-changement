/**
 * Couleurs stables par projet pour la roadmap (palette distincte, ordre de la liste).
 * L’assignation par **index** dans la liste éligible garantit des teintes différentes pour chaque
 * projet affiché (contrairement à un simple hash d’UUID, qui peut collisionner).
 */
export const ROADMAP_PROJECT_PALETTE = [
  '#8E3B46', // bordeaux
  '#4C86A8', // bleu
  '#477890', // bleu outils
  '#B45309', // ambre
  '#2d6a4f', // vert
  '#6b4c9a', // violet
  '#c45c26', // orange
  '#3d6b7a', // bleu-gris
  '#b91c1c', // rouge
  '#0d9488', // teal
  '#ca8a04', // jaune or
  '#7c3aed', // violet vif
  '#db2777', // rose
  '#059669', // émeraude
  '#ea580c', // orange vif
  '#2563eb', // bleu roi
] as const

/** Couleur par position dans la liste des projets roadmap (toujours distincte jusqu’à palette.length projets). */
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
