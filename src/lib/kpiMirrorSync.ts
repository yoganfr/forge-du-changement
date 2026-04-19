import { supabase } from './supabase'
import type { Jalon } from './types'
import { createChantier, createJalon, deleteJalon, getProjetChantiers, updateJalon } from './api/roadmap'

export function buildKpiMirrorNom(kpiDescription: string, kpiValeurCible: string): string {
  const d = kpiDescription.trim()
  const v = kpiValeurCible.trim()
  return `${d} (cible ${v})`
}

export async function findKpiMirrorJalonByParent(parentId: string): Promise<Jalon | null> {
  const { data, error } = await supabase
    .from('jalons')
    .select('*')
    .eq('kpi_source_jalon_id', parentId)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as Jalon | null
}

/**
 * Crée / met à jour / supprime le jalon KPI miroir selon les champs KPI du parent.
 * Idempotent si les données sont stables.
 */
export async function syncKpiMirrorForParentJalon(params: {
  parent: Jalon
  parentChantierNom: string
}): Promise<void> {
  const { parent, parentChantierNom } = params
  if (parent.kpi_source_jalon_id) return
  const desc = (parent.kpi_description ?? '').trim()
  const val = (parent.kpi_valeur_cible ?? '').trim()
  const hasKpi = desc.length > 0 && val.length > 0

  const existing = await findKpiMirrorJalonByParent(parent.id)

  if (!hasKpi) {
    if (existing) await deleteJalon(existing.id)
    return
  }

  const nomMiroir = buildKpiMirrorNom(desc, val)
  const allCh = await getProjetChantiers(parent.projet_id)
  const wantNom = parentChantierNom.trim() || 'Chantier'
  const matchNom = (nom: string) => nom.trim().toLowerCase() === wantNom.toLowerCase()
  let kpiCh = allCh.find((c) => c.axe === 'KPI' && matchNom(c.nom))
  if (!kpiCh) {
    const ordreKpi = allCh.filter((c) => c.axe === 'KPI').reduce((m, c) => Math.max(m, c.ordre), 0) || 0
    kpiCh = await createChantier({
      projet_id: parent.projet_id,
      workspace_id: parent.workspace_id,
      nom: wantNom,
      axe: 'KPI',
      ordre: ordreKpi + 1,
    })
  }

  if (existing) {
    await updateJalon(existing.id, {
      chantier_id: kpiCh.id,
      projet_id: parent.projet_id,
      axe: 'KPI',
      nom: nomMiroir,
      mois_cible: parent.mois_cible,
      annee_cible: parent.annee_cible,
      kpi_description: desc,
      kpi_valeur_cible: val,
    })
    return
  }

  await createJalon({
    chantier_id: kpiCh.id,
    projet_id: parent.projet_id,
    workspace_id: parent.workspace_id,
    axe: 'KPI',
    nom: nomMiroir,
    mois_cible: parent.mois_cible,
    annee_cible: parent.annee_cible,
    kpi_description: desc,
    kpi_valeur_cible: val,
    kpi_source_jalon_id: parent.id,
    statut: 'a_venir',
  })
}
