import { supabase } from '../supabase'

/** Bucket logos / pièces jointes non sensibles. */
export const STORAGE_BUCKET_ASSETS = 'assets'

/**
 * URL publique (lecture ouverte si le bucket est public).
 * Point unique à migrer vers {@link createSignedAssetUrl} pour les fichiers sensibles.
 */
export function isStorageBucketNotFound(error: unknown): boolean {
  const msg =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message ?? '').toLowerCase()
      : ''
  return msg.includes('bucket') && msg.includes('not found')
}

export async function uploadImageToStorage(params: {
  file: File
  folder: string
  filenamePrefix?: string
}): Promise<string> {
  const ext = params.file.name.split('.').pop()?.toLowerCase() || 'bin'
  const safeFolder = params.folder.replace(/^\/+|\/+$/g, '')
  const safePrefix = (params.filenamePrefix ?? 'file').replace(/[^a-zA-Z0-9_-]/g, '-')
  const path = `${safeFolder}/${safePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET_ASSETS)
    .upload(path, params.file, { upsert: false, contentType: params.file.type })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(STORAGE_BUCKET_ASSETS).getPublicUrl(path)
  return data.publicUrl
}

/** URL signée (bucket privé). Prêt pour migration hors `getPublicUrl`. */
export async function createSignedAssetUrl(path: string, expiresInSec = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET_ASSETS)
    .createSignedUrl(path, expiresInSec)
  if (error) throw error
  return data.signedUrl
}
