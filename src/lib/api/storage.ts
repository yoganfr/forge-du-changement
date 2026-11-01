import { supabase } from '../supabase'
import { imageExtensionForUpload } from './storageValidation'

/** Bucket logos / pièces jointes non sensibles. */
export const STORAGE_BUCKET_ASSETS = 'assets'

const PUBLIC_ASSET_MARKER = `/storage/v1/object/public/${STORAGE_BUCKET_ASSETS}/`
const SIGNED_ASSET_MARKER = `/storage/v1/object/sign/${STORAGE_BUCKET_ASSETS}/`

/**
 * Chemin du fichier dans le dossier photos, à partir de l’adresse enregistrée.
 * Les adresses externes (Gravatar, Google) et les aperçus locaux ne sont pas des fichiers du dossier.
 */
export function assetPathFromStoredValue(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return null
  const publicAt = trimmed.indexOf(PUBLIC_ASSET_MARKER)
  if (publicAt >= 0) {
    const rest = trimmed.slice(publicAt + PUBLIC_ASSET_MARKER.length).split('?')[0]
    return rest ? decodeURIComponent(rest) : null
  }
  const signedAt = trimmed.indexOf(SIGNED_ASSET_MARKER)
  if (signedAt >= 0) {
    const rest = trimmed.slice(signedAt + SIGNED_ASSET_MARKER.length).split('?')[0]
    return rest ? decodeURIComponent(rest) : null
  }
  if (!trimmed.includes('://')) return trimmed.replace(/^\/+/, '')
  return null
}

/** Lien d’affichage : temporaire si le fichier est dans le dossier photos, inchangé sinon. */
export async function resolveStoredAssetUrl(value: string | null | undefined): Promise<string | null> {
  const trimmed = value?.trim()
  if (!trimmed) return null
  const path = assetPathFromStoredValue(trimmed)
  if (!path) return trimmed
  try {
    return await createSignedAssetUrl(path)
  } catch (err) {
    console.warn('[assets]', err instanceof Error ? err.message : 'lien image impossible')
    return null
  }
}

const OWNER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function requireAssetOwnerId(id: string): string {
  const trimmed = id.trim()
  if (!OWNER_ID.test(trimmed)) {
    throw new Error('Identifiant de dossier invalide')
  }
  return trimmed
}

/** Dossier du logo d’une entreprise. L’ancienne règle du bucket reste ouverte. */
export function workspaceLogoFolder(workspaceId: string): string {
  return `workspaces/${requireAssetOwnerId(workspaceId)}/logos`
}

/** Dossier de la photo d’une personne. */
export function userAvatarFolder(userId: string): string {
  return `users/${requireAssetOwnerId(userId)}/avatars`
}

/**
 * Chemin effaçable dans le dossier photos.
 * Gravatar, Google et aperçus locaux ne le sont pas.
 */
export function deletableAssetPath(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  const path = assetPathFromStoredValue(value)
  if (!path) return null
  const parts = path.split('/')
  if (parts.some((part) => !part || part === '.' || part === '..')) return null
  return path
}

export async function deleteStoredAsset(value: string | null | undefined): Promise<void> {
  const path = deletableAssetPath(value)
  if (!path) return
  const { error } = await supabase.storage.from(STORAGE_BUCKET_ASSETS).remove([path])
  if (error) throw error
}

/** Efface un fichier déjà remplacé. Un échec ne remet pas l’ancienne image. */
export async function releaseReplacedAsset(value: string | null | undefined): Promise<void> {
  try {
    await deleteStoredAsset(value)
  } catch (err) {
    console.warn('[assets]', err instanceof Error ? err.message : 'suppression impossible')
  }
}

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
  const ext = imageExtensionForUpload(params.file)
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
