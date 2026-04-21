import { supabase } from '../supabase'
import type { RaciChantier, RaciChantierEntiteType } from '../types'
import { dedupedFetch, invalidateCache } from './cache'
import { insertAuditEvent } from './audit'

/**
 * REF-7b.1 — matrice PCI (Pilote / Contributeur / Informé) par chantier.
 *
 * Modèle stakeholder-centric : une ligne `raci_chantiers` = une colonne dans la matrice UI.
 * Les rôles sont multi-cochables via 3 booléens (is_pilote / is_contributeur / is_informe).
 * L'entité est obligatoire (direction ou autre) ; la personne est optionnelle.
 *
 * Caches :
 * - `raci-chantiers:<chantier_id>` : liste triée des parties prenantes d'un chantier
 * - `raci-chantiers-projet:<projet_id>` : batch toutes les RACI des chantiers d'un projet (évite N+1)
 */

type ChantierContextRow = {
  projet_id: string
  workspace_id: string
}

async function getChantierContext(chantier_id: string): Promise<ChantierContextRow | null> {
  const { data } = await supabase
    .from('chantiers')
    .select('projet_id, workspace_id')
    .eq('id', chantier_id)
    .maybeSingle()
  return (data ?? null) as ChantierContextRow | null
}

function invalidateRaciChantierCaches(params: { chantier_id?: string; projet_id?: string }): void {
  const prefixes: string[] = []
  if (params.chantier_id) prefixes.push(`raci-chantiers:${params.chantier_id}`)
  if (params.projet_id) prefixes.push(`raci-chantiers-projet:${params.projet_id}`)
  invalidateCache(prefixes)
}

async function resolveCreatedByUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const email = session?.user?.email?.trim().toLowerCase()
  if (!email) return null
  const { data } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
  return (data as { id?: string } | null)?.id ?? null
}

/** Liste des parties prenantes d'un chantier, triées par `ordre_affichage` puis `created_at`. */
export async function listRaciChantiersForChantier(chantier_id: string): Promise<RaciChantier[]> {
  return dedupedFetch(`raci-chantiers:${chantier_id}`, async () => {
    const { data, error } = await supabase
      .from('raci_chantiers')
      .select('*')
      .eq('chantier_id', chantier_id)
      .order('ordre_affichage', { ascending: true })
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as RaciChantier[]
  })
}

const RACI_CHANTIER_IN_CHUNK_SIZE = 200

/**
 * Charge en batch toutes les RACI d'une liste de chantiers (évite N+1 sur MaturityRoadmap).
 * Garantit une clé par chantier dans le map retourné, même en cas d'absence de parties prenantes.
 */
export async function getRaciChantiersByChantierIds(
  chantierIds: string[],
): Promise<Record<string, RaciChantier[]>> {
  const unique = [...new Set(chantierIds.filter(Boolean))]
  const out: Record<string, RaciChantier[]> = Object.fromEntries(
    unique.map((id) => [id, [] as RaciChantier[]]),
  )
  if (unique.length === 0) return out

  const merged: RaciChantier[] = []
  for (let i = 0; i < unique.length; i += RACI_CHANTIER_IN_CHUNK_SIZE) {
    const chunk = unique.slice(i, i + RACI_CHANTIER_IN_CHUNK_SIZE)
    const { data, error } = await supabase
      .from('raci_chantiers')
      .select('*')
      .in('chantier_id', chunk)
    if (error) throw error
    merged.push(...((data ?? []) as RaciChantier[]))
  }

  for (const r of merged) {
    if (out[r.chantier_id]) out[r.chantier_id]!.push(r)
    else out[r.chantier_id] = [r]
  }
  for (const id of unique) {
    const sorted = (out[id] ?? []).sort((a, b) => {
      if (a.ordre_affichage !== b.ordre_affichage) return a.ordre_affichage - b.ordre_affichage
      return a.created_at.localeCompare(b.created_at)
    })
    out[id] = sorted
  }
  return out
}

/** Version cachée par projet (pour alimenter MaturityRoadmap en une seule passe). */
export async function getRaciChantiersForProjet(
  projet_id: string,
  chantierIds: string[],
): Promise<Record<string, RaciChantier[]>> {
  return dedupedFetch(`raci-chantiers-projet:${projet_id}`, async () => {
    return getRaciChantiersByChantierIds(chantierIds)
  })
}

export type CreateRaciChantierInput = {
  chantier_id: string
  entite_type: RaciChantierEntiteType
  entite_nom: string
  direction_id?: string | null
  personne_nom?: string | null
  user_id?: string | null
  is_pilote?: boolean
  is_contributeur?: boolean
  is_informe?: boolean
  motivation?: string | null
}

/** Ajoute une partie prenante (nouvelle colonne) à la matrice RACI d'un chantier. */
export async function createRaciChantier(input: CreateRaciChantierInput): Promise<RaciChantier> {
  if (!input.chantier_id) throw new Error('createRaciChantier: chantier_id est requis')
  if (!input.entite_nom || input.entite_nom.trim() === '') {
    throw new Error('createRaciChantier: entite_nom est requis')
  }
  if (!input.entite_type) throw new Error('createRaciChantier: entite_type est requis')

  const isPilote = input.is_pilote ?? false
  const isContrib = input.is_contributeur ?? false
  const isInforme = input.is_informe ?? false
  if (!isPilote && !isContrib && !isInforme) {
    throw new Error(
      'createRaciChantier: au moins un rôle (is_pilote, is_contributeur, is_informe) doit être coché',
    )
  }

  const { data: existing } = await supabase
    .from('raci_chantiers')
    .select('ordre_affichage')
    .eq('chantier_id', input.chantier_id)
    .order('ordre_affichage', { ascending: false })
    .limit(1)
  const maxOrdre = ((existing ?? []) as { ordre_affichage?: number }[])[0]?.ordre_affichage ?? -1

  const created_by = await resolveCreatedByUserId()

  const insert: Record<string, unknown> = {
    chantier_id: input.chantier_id,
    entite_type: input.entite_type,
    entite_nom: input.entite_nom.trim(),
    direction_id: input.direction_id ?? null,
    personne_nom: input.personne_nom?.trim() || null,
    user_id: input.user_id ?? null,
    is_pilote: isPilote,
    is_contributeur: isContrib,
    is_informe: isInforme,
    motivation: input.motivation?.trim() || null,
    ordre_affichage: maxOrdre + 1,
    created_by,
  }

  const { data, error } = await supabase
    .from('raci_chantiers')
    .insert(insert)
    .select()
    .single()
  if (error) throw error
  const row = data as RaciChantier

  const ctx = await getChantierContext(input.chantier_id)
  invalidateRaciChantierCaches({
    chantier_id: input.chantier_id,
    projet_id: ctx?.projet_id,
  })

  if (ctx) {
    await insertAuditEvent({
      workspace_id: ctx.workspace_id,
      action: 'raci_chantier_created',
      payload: {
        chantier_id: input.chantier_id,
        raci_chantier_id: row.id,
        entite_type: row.entite_type,
        entite_nom: row.entite_nom,
        direction_id: row.direction_id,
        personne_nom: row.personne_nom,
        is_pilote: row.is_pilote,
        is_contributeur: row.is_contributeur,
        is_informe: row.is_informe,
      },
    })
  }

  return row
}

export type UpdateRaciChantierInput = Partial<
  Pick<
    RaciChantier,
    | 'entite_type'
    | 'entite_nom'
    | 'direction_id'
    | 'personne_nom'
    | 'user_id'
    | 'is_pilote'
    | 'is_contributeur'
    | 'is_informe'
    | 'motivation'
    | 'ordre_affichage'
  >
>

/**
 * Met à jour une partie prenante existante.
 * La contrainte SQL `raci_chantier_at_least_one_role` est vérifiée côté client si les 3 rôles sont modifiés en même temps.
 */
export async function updateRaciChantier(
  id: string,
  input: UpdateRaciChantierInput,
): Promise<RaciChantier> {
  if (!id) throw new Error('updateRaciChantier: id est requis')

  if (
    input.is_pilote === false &&
    input.is_contributeur === false &&
    input.is_informe === false
  ) {
    throw new Error(
      'updateRaciChantier: au moins un rôle doit rester coché (P, C ou I). Supprimez la partie prenante pour la retirer complètement.',
    )
  }

  const payload: Record<string, unknown> = {
    ...input,
    updated_at: new Date().toISOString(),
  }
  if (input.entite_nom !== undefined) {
    payload.entite_nom = input.entite_nom.trim()
  }
  if (input.personne_nom !== undefined) {
    payload.personne_nom = input.personne_nom?.trim() || null
  }
  if (input.motivation !== undefined) {
    payload.motivation = input.motivation?.trim() || null
  }

  const { data, error } = await supabase
    .from('raci_chantiers')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  const row = data as RaciChantier

  const ctx = await getChantierContext(row.chantier_id)
  invalidateRaciChantierCaches({
    chantier_id: row.chantier_id,
    projet_id: ctx?.projet_id,
  })

  if (ctx) {
    await insertAuditEvent({
      workspace_id: ctx.workspace_id,
      action: 'raci_chantier_updated',
      payload: {
        chantier_id: row.chantier_id,
        raci_chantier_id: row.id,
        changes: input,
      },
    })
  }

  return row
}

/**
 * Toggle d'un rôle P/C/I (mutation atomique). Raccourci courant utilisé par la matrice UI.
 */
export async function toggleRaciChantierRole(
  id: string,
  role: 'pilote' | 'contributeur' | 'informe',
  next: boolean,
): Promise<RaciChantier> {
  const field =
    role === 'pilote' ? 'is_pilote' : role === 'contributeur' ? 'is_contributeur' : 'is_informe'
  return updateRaciChantier(id, { [field]: next } as UpdateRaciChantierInput)
}

/** Supprime une partie prenante (colonne) d'un chantier. */
export async function deleteRaciChantier(id: string): Promise<void> {
  if (!id) throw new Error('deleteRaciChantier: id est requis')

  const { data: before } = await supabase
    .from('raci_chantiers')
    .select('chantier_id, entite_nom, personne_nom')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('raci_chantiers').delete().eq('id', id)
  if (error) throw error

  if (before) {
    const row = before as { chantier_id: string; entite_nom: string; personne_nom: string | null }
    const ctx = await getChantierContext(row.chantier_id)
    invalidateRaciChantierCaches({
      chantier_id: row.chantier_id,
      projet_id: ctx?.projet_id,
    })
    if (ctx) {
      await insertAuditEvent({
        workspace_id: ctx.workspace_id,
        action: 'raci_chantier_deleted',
        payload: {
          chantier_id: row.chantier_id,
          raci_chantier_id: id,
          entite_nom: row.entite_nom,
          personne_nom: row.personne_nom,
        },
      })
    }
  }
}

/**
 * Réordonne les colonnes de la matrice RACI d'un chantier (drag & drop).
 * Envoie une mise à jour par partie prenante impactée, dans l'ordre fourni.
 */
export async function reorderRaciChantiersForChantier(
  chantier_id: string,
  orderedIds: string[],
): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('raci_chantiers')
      .update({ ordre_affichage: i, updated_at: new Date().toISOString() })
      .eq('id', orderedIds[i])
      .eq('chantier_id', chantier_id)
    if (error) throw error
  }
  const ctx = await getChantierContext(chantier_id)
  invalidateRaciChantierCaches({ chantier_id, projet_id: ctx?.projet_id })
}
