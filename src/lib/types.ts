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
