const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
])

const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'])

/** 10 Mo : les photos téléphone (avatar) passent, les fichiers arbitraires non. */
export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024

export function validateImageFile(file: { name: string; type: string; size: number }): string | null {
  if (!Number.isFinite(file.size) || file.size <= 0) return 'Le fichier est vide.'
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) return 'L’image dépasse 10 Mo.'
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const mime = file.type.trim().toLowerCase()
  if (ext === 'svg' || mime === 'image/svg+xml' || mime === 'text/html') {
    return 'Ce format n’est pas accepté. Utilisez JPEG, PNG, WebP, GIF ou HEIC.'
  }
  if (mime && ALLOWED_MIME.has(mime)) return null
  if (!mime && ALLOWED_EXT.has(ext)) return null
  return 'Ce format n’est pas accepté. Utilisez JPEG, PNG, WebP, GIF ou HEIC.'
}

/** Extension stockée, dérivée du type validé — jamais de l’extension brute du nom de fichier. */
export function imageExtensionForUpload(file: { name: string; type: string; size: number }): string {
  const invalid = validateImageFile(file)
  if (invalid) throw new Error(invalid)
  const mime = file.type.trim().toLowerCase()
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/gif') return 'gif'
  if (mime === 'image/heic' || mime === 'image/heif') return 'heic'
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'jpeg') return 'jpg'
  if (ext === 'heif') return 'heic'
  return ext
}
