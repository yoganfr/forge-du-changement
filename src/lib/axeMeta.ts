import type { Axe } from './types'

/** Ordre d’affichage et de traitement (inchangé côté données : PROCESSUS … KPI). */
export const AXES: Axe[] = ['PROCESSUS', 'ORGANISATION', 'OUTILS', 'KPI']

export type AxeDisplayMeta = {
  /** Pastille courte dans la grille (badges d’axe). */
  short: string
  /** Libellé menu / en-têtes de colonne (numérotation stable). */
  title: string
  /** Couleur de marqueur / rappels UI (hex). */
  color: string
  /** Périmètre fonctionnel de l’axe (aide contextuelle). */
  description: string
}

/**
 * Libellés et descriptions produit des quatre axes.
 * Les clés techniques (`Axe` en base) restent inchangées.
 */
/** Toast / erreur : déplacement de chantier interdit vers l’axe indicateurs (clé technique `KPI`). */
export const MSG_CHANTIER_DROP_INTERDIT_AXE_MESURE =
  'Un chantier ne peut pas être déplacé vers l’axe « Mesure des effets » (réservé aux jalons synchronisés automatiquement).'

export const AXE_META: Record<Axe, AxeDisplayMeta> = {
  PROCESSUS: {
    short: 'P',
    title: '1. Processus / Métier',
    color: '#8E3B46',
    description:
      'Évolutions de fonctionnement, standards, interfaces, innovation et conformité.',
  },
  ORGANISATION: {
    short: 'O',
    title: '2. Organisation',
    color: '#4C86A8',
    description:
      'Coordination, gouvernance, structuration des équipes, compétences, culture et accompagnement du changement.',
  },
  OUTILS: {
    short: 'L',
    title: "3. Leviers d'Exécution",
    color: '#477890',
    description:
      'Moyens concrets, méthodologiques, digitaux, visuels et financiers nécessaires à la mise en œuvre.',
  },
  KPI: {
    short: 'M',
    title: '4. Mesure des Effets & Indicateurs de Suivi',
    color: '#B45309',
    description:
      'À chaque jalon : observer les effets réels et tangibles du changement produit.',
  },
}
