export type Workspace = {
  id: string
  company_name: string
  sector: string | null
  size: 'PME' | 'ETI' | 'Grand groupe' | null
  logo_url: string | null
  trigram_convention: 'prenom_nom_3' | 'nom_prenom_3' | 'custom' | null
  current_step: number | null
  /** Membre CODIR taggé « dirigeant » du workspace (auteur du discours de transformation). */
  dirigeant_user_id: string | null
  created_at: string
}

export type User = {
  id: string
  workspace_id: string
  email: string
  prenom: string | null
  nom: string | null
  job_title: string | null
  avatar_url: string | null
  role: 'consultant' | 'admin' | 'codir' | 'pilote' | 'contributeur'
  direction_type: 'Fonctionnel' | 'Métier' | 'Géographique' | null
  direction_nom: string | null
  direction_id: string | null
  trigram: string | null
  managed_count: number
  total_effectif: number
  status: 'invite' | 'actif' | 'inactif'
  created_at: string
  /** Super-admin plateforme (RLS + RPC `is_platform_superadmin`) */
  is_platform_superadmin?: boolean
}

export type Direction = {
  id: string
  workspace_id: string
  user_id: string | null
  nom: string
  type: 'Fonctionnel' | 'Métier' | 'Géographique' | null
  mission: string | null
  vision: string | null
  color: string
  is_transverse: boolean
  created_at: string
}

export type Projet = {
  id: string
  direction_id: string
  workspace_id: string
  nom: string
  thematique: string | null
  problematique: string | null
  description: string | null
  type: 'RUN' | 'BUILD'
  score_criticite: number
  score_urgence: number
  score_recurrence: number
  score_temps: number
  score_etp: number
  score_investissement: number
  competences_dispo: boolean
  selected_for_transfo: boolean
  /** Validé décideur pour passage en Maturity Roadmap (chantiers / jalons). */
  dg_validated_transfo: boolean
  pilote: string | null
  gains_quantitatifs: number | null
  gains_qualitatifs: string | null
  planning: Record<string, boolean>
  directions_contributrices: string[]
  created_at: string
  updated_at: string
}

export type Invitation = {
  id: string
  workspace_id: string
  email: string
  role: 'consultant' | 'codir' | 'pilote' | 'contributeur'
  direction_id: string | null
  trigram: string | null
  invited_by: string | null
  token: string
  status: 'en_attente' | 'acceptee' | 'expiree'
  created_at: string
}

export type DashboardDgDirectionStats = {
  directionId: string
  directionName: string
  totalProjects: number
  runProjects: number
  buildProjects: number
  avgBuildScore: number
  selectedBuildCount: number
}

export type DashboardDgKpis = {
  totalProjects: number
  runProjects: number
  buildProjects: number
  activeDirections: number
  avgBuildScore: number
  criticalProjects: number
}

export type AuditEvent = {
  id: string
  workspace_id: string | null
  actor_user_id: string | null
  action: string
  payload: Record<string, unknown> | null
  created_at: string
}

export type Axe = 'PROCESSUS' | 'ORGANISATION' | 'OUTILS' | 'KPI'

export type JalonStatut = 'a_venir' | 'en_cours' | 'realise' | 'bloque'

export type JalonFacette =
  | 'CONCEPTUALISATION'
  | 'FORMATION'
  | 'ACQUISITION'
  | 'PRODUCTION'
  | 'COMMUNICATION'
  | 'AUTRE'

export type Chantier = {
  id: string
  projet_id: string
  workspace_id: string
  nom: string
  description: string | null
  /** Zone (axe) où le chantier a été créé ; les jalons de la ligne suivent ce type. Absent / NULL = données historiques. */
  axe?: Axe | null
  ordre: number
  created_at: string
  updated_at: string
}

export type Jalon = {
  id: string
  chantier_id: string
  projet_id: string
  workspace_id: string
  direction_id: string | null
  axe: Axe
  numero: string | null
  nom: string
  description: string | null
  mois_cible: number | null
  annee_cible: number | null
  ordre_sequentiel: number
  statut: JalonStatut
  responsable: string | null
  decideur: string | null
  kpi_description: string | null
  kpi_valeur_cible: string | null
  facette: JalonFacette | null
  jalon_dependance_id: string | null
  /** Si défini, ce jalon est le reflet KPI auto d’un jalon parent (voir `syncKpiMirrorForParentJalon`). */
  kpi_source_jalon_id?: string | null
  note_contexte: string | null
  created_at: string
  updated_at: string
}

export type RaciRole = 'PILOTE' | 'IMPLIQUE' | 'INFORME'

export type RaciJalon = {
  id: string
  jalon_id: string
  direction_id: string
  role: RaciRole
  created_at: string
}

/**
 * Matrice PCI par chantier (REF-7b.1) — stakeholder-centric.
 * Une ligne = une partie prenante (colonne de la matrice UI) avec ses rôles P/C/I multi-cochables.
 * Modèle simplifié du RACI classique : P combine R+A, C = consulté/contribue, I = informé.
 */
export type RaciChantierEntiteType = 'direction' | 'autre'

export type RaciChantier = {
  id: string
  chantier_id: string
  /** Niveau de l'entité. Pour V1 : `direction` (lien optionnel vers public.directions) ou `autre` (texte libre). */
  entite_type: RaciChantierEntiteType
  /** Nom de l'entité affiché en en-tête de colonne (ex : "DRH", "Cabinet XX"). */
  entite_nom: string
  /** Lien optionnel vers public.directions si l'entité existe déjà dans le référentiel du workspace. */
  direction_id: string | null
  /** Personne nommément désignée (optionnel, saisie libre "Prénom NOM"). */
  personne_nom: string | null
  /** Lien optionnel vers public.users si la personne est un user du workspace. */
  user_id: string | null
  /** P : Pilote (combine Responsible + Accountable du RACI classique). */
  is_pilote: boolean
  /** C : Contributeur (ancien "Consulted", acteur qui contribue / est sollicité). */
  is_contributeur: boolean
  /** I : Informé (reçoit l'information, pas de contribution active). */
  is_informe: boolean
  /** Explication du pourquoi cette partie prenante est impliquée (affichée en tooltip). */
  motivation: string | null
  ordre_affichage: number
  created_at: string
  updated_at: string
  created_by: string | null
}

// ─── Discours de transformation (V1) ──────────────────────────────────────────
// Un discours par workspace (cloisonné par `workspace_id` + RLS), écrit par le
// dirigeant du workspace (ou superadmin / consultant / admin / pilote).

/** Valeur d'un champ du discours : texte libre, liste de puces, ou liste de cartouches structurés. */
export type DiscoursFieldValue = string | string[] | Array<Record<string, string>> | null

/** Payload structuré des 8 blocs performatifs (§2.3 du doc de référence). */
export type DiscoursBlocsPayload = Record<string, Record<string, DiscoursFieldValue>>

/** Résultat d'un scoring (rule-based et/ou IA). */
export type DiscoursScoreSnapshot = {
  /** Score global /100 agrégé à partir des 5 dimensions. */
  total: number
  /** 5 dimensions § 3.1.1 — chacune /20. */
  dimensions: {
    clarte_strategique: number
    force_narrative: number
    credibilite_manageriale: number
    pouvoir_mobilisateur: number
    performativite_collective: number
  }
  /** Niveau synthétique § 3.3 : 1 = à retravailler, 2 = solide, 3 = transformant. */
  niveau: 1 | 2 | 3
  forces: string[]
  vigilances: string[]
  recommandations: string[]
  /** Source du scoring : `rules` (local, déterministe) ou `ai` (LLM via Edge function). */
  source: 'rules' | 'ai'
  /** Horodatage du calcul. */
  computed_at: string
}

export type TransformationDiscourse = {
  id: string
  workspace_id: string
  current_version_id: string | null
  created_at: string
  updated_at: string
}

export type TransformationDiscourseVersion = {
  id: string
  discourse_id: string
  version_label: string
  blocs: DiscoursBlocsPayload
  score_snapshot: DiscoursScoreSnapshot | null
  created_by: string | null
  created_at: string
  updated_at: string
}
