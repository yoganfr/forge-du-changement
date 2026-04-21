import Link from "next/link";

export default function AccesMembresPage() {
  return (
    <main className="landing-main">
      <section className="landing-section">
        <h1>Acces membres</h1>
        <p className="landing-subtitle">
          Cette entree membre est maintenant integree au site Next.js.
          Le workflow complet d&apos;authentification et d&apos;onboarding est en cours de migration.
        </p>
        <p className="landing-note">
          Objectif: une seule plateforme, avec separation claire entre pages publiques
          commerciales et espaces prives workspace.
        </p>
        <div className="landing-hero__actions">
          <Link className="landing-btn landing-btn--primary" href="/bientot-disponible">
            Connexion membre (bientot disponible)
          </Link>
          <Link className="landing-btn landing-btn--ghost" href="/">
            Retour a l&apos;accueil
          </Link>
        </div>
      </section>
    </main>
  );
}
