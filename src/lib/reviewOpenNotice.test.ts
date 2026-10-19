import { describe, expect, it } from 'vitest'
import {
  formatReviewOpenResult,
  reviewEmailFailureReason,
  reviewPathFromAuthNext,
} from './reviewOpenNotice'

describe('reviewPathFromAuthNext', () => {
  it('accepte uniquement une revue identifiée', () => {
    expect(
      reviewPathFromAuthNext('/review/4f58222c-6fe8-4be5-85ec-0d3f6389bf16'),
    ).toBe('/review/4f58222c-6fe8-4be5-85ec-0d3f6389bf16')
  })

  it('refuse une adresse externe ou un autre écran', () => {
    expect(reviewPathFromAuthNext('https://exemple.fr')).toBeNull()
    expect(reviewPathFromAuthNext('//exemple.fr/review/4f58222c-6fe8-4be5-85ec-0d3f6389bf16')).toBeNull()
    expect(reviewPathFromAuthNext('/')).toBeNull()
  })
})

describe('reviewEmailFailureReason', () => {
  it('traduit la limite d’envoi et l’absence de compte', () => {
    expect(reviewEmailFailureReason(new Error('email rate limit exceeded'))).toBe(
      'limite d’envoi atteinte',
    )
    expect(reviewEmailFailureReason(new Error('Signups not allowed for otp'))).toBe(
      'pas de compte de connexion pour cet e-mail',
    )
  })
})

describe('formatReviewOpenResult', () => {
  it('dit qui a reçu l’e-mail et qui ne l’a pas reçu', () => {
    const text = formatReviewOpenResult({
      label: 'V1 mai 2026',
      copied: true,
      link: 'http://localhost/review/x',
      sent: ['Ada Martin'],
      failed: [{ name: 'Corinne Contributrice', reason: 'limite d’envoi atteinte' }],
      traced: true,
    })
    expect(text).toContain('Revue ouverte sur V1 mai 2026.')
    expect(text).toContain('Lien copié.')
    expect(text).toContain('E-mail de connexion envoyé à Ada Martin.')
    expect(text).toContain('Corinne Contributrice (limite d’envoi atteinte)')
    expect(text).toContain('La trace d’ouverture est enregistrée.')
  })
})
