import { supabase } from '../supabase'

async function resolveCurrentAppUser(): Promise<{ id: string | null; email: string | null }> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const email = session?.user?.email?.trim().toLowerCase() ?? null
  if (!email) return { id: null, email: null }
  const { data } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
  return { id: data?.id ?? null, email }
}

export type RoadmapSnapshotStatus = 'draft' | 'in_review' | 'closed'

export type RoadmapSnapshotItemInput = {
  kind: 'chantier' | 'jalon'
  source_id: string
  payload: Record<string, unknown>
}

export type RoadmapSnapshot = {
  id: string
  workspace_id: string
  projet_id: string | null
  label: string
  status: RoadmapSnapshotStatus
  frozen_at: string
  closed_at: string | null
  created_by: string | null
  created_by_email: string | null
  created_at: string
}

export async function listRoadmapSnapshots(workspaceId: string, projetId?: string | null): Promise<RoadmapSnapshot[]> {
  let query = supabase
    .from('roadmap_snapshots')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(30)

  if (projetId) {
    query = query.eq('projet_id', projetId)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as RoadmapSnapshot[]
}

export async function createRoadmapSnapshot(params: {
  workspaceId: string
  projetId?: string | null
  label: string
  status?: RoadmapSnapshotStatus
  items: RoadmapSnapshotItemInput[]
}): Promise<RoadmapSnapshot> {
  const { id: created_by, email: created_by_email } = await resolveCurrentAppUser()
  const { data: snapshot, error } = await supabase
    .from('roadmap_snapshots')
    .insert({
      workspace_id: params.workspaceId,
      projet_id: params.projetId ?? null,
      label: params.label,
      status: params.status ?? 'draft',
      frozen_at: new Date().toISOString(),
      created_by,
      created_by_email,
    })
    .select('*')
    .single()

  if (error || !snapshot) throw error ?? new Error('Impossible de créer le snapshot roadmap')

  if (params.items.length > 0) {
    const { error: itemsError } = await supabase
      .from('roadmap_snapshot_items')
      .insert(
        params.items.map((item) => ({
          snapshot_id: snapshot.id,
          kind: item.kind,
          source_id: item.source_id,
          payload: item.payload,
        })),
      )
    if (itemsError) throw itemsError
  }

  return snapshot as RoadmapSnapshot
}
