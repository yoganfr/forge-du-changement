const REVIEW_PATH =
  /^\/review\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type ReviewOpenFailure = {
  name: string
  reason: string
}

export function reviewPathFromAuthNext(raw: string | null): string | null {
  if (!raw || raw.startsWith('//')) return null
  const path = raw.split(/[?#]/)[0] ?? ''
  if (!REVIEW_PATH.test(path)) return null
  return path
}

export function reviewEmailFailureReason(error: unknown): string {
  const message = error instanceof Error ? error.message : ''
  if (/patienter/i.test(message)) return 'merci de patienter avant un nouvel envoi'
  if (/rate|too many|once every|email rate/i.test(message)) {
    return 'limite d’envoi atteinte'
  }
  if (/not found|signup|signups not allowed|user not allowed|otp_disabled/i.test(message)) {
    return 'pas de compte de connexion pour cet e-mail'
  }
  return 'envoi impossible'
}

export function formatReviewOpenResult(params: {
  label: string
  copied: boolean
  link: string
  sent: string[]
  failed: ReviewOpenFailure[]
  traced: boolean
}): string {
  const parts = [`Revue ouverte sur ${params.label}.`]
  parts.push(
    params.copied
      ? 'Lien copié.'
      : `Le lien n’a pas pu être copié : ${params.link}.`,
  )
  if (params.sent.length > 0) {
    parts.push(`E-mail de connexion envoyé à ${params.sent.join(', ')}.`)
  }
  if (params.failed.length > 0) {
    const details = params.failed.map((item) => `${item.name} (${item.reason})`).join(', ')
    parts.push(`E-mail non envoyé pour ${details}.`)
  }
  if (params.sent.length === 0 && params.failed.length === 0) {
    parts.push('Aucun e-mail n’a été envoyé.')
  }
  parts.push(
    params.traced
      ? 'La trace d’ouverture est enregistrée.'
      : 'La trace d’ouverture n’a pas pu être enregistrée.',
  )
  return parts.join(' ')
}
