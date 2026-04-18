export type Workspace = {
  id: string
  company_name: string
  sector: string | null
  size: 'PME' | 'ETI' | 'Grand groupe' | null
  logo_url: string | null
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
  /** Validé DG pour passage en Maturity Roadmap (chantiers / jalons). */
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
