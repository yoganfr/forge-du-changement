/**
 * Couleur stable par projet pour la roadmap (palette proche du design system La Forge).
 * Plusieurs projets sur une même vue auront des teintes distinctes.
 */
const PALETTE_HEX = [
  '#8E3B46', // brand bordeaux
  '#4C86A8', // bleu organisation
  '#477890', // outils
  '#B45309', // KPI / ambre
  '#2d6a4f', // vert
  '#6b4c9a', // violet
  '#c45c26', // orange
  '#3d6b7a', // bleu-gris
] as const

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function getRoadmapProjectColorHex(projetId: string): string {
  const i = hashString(projetId) % PALETTE_HEX.length
  return PALETTE_HEX[i]
}
