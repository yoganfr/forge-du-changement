import Link from "next/link";

export default function BientotDisponiblePage() {
  return (
    <main className="landing-main">
      <section className="landing-section">
        <h1>Bientot disponible</h1>
        <p className="landing-subtitle">
          Le parcours reel de demonstration est en preparation.
          Cette page sera connectee au workspace demo des qu&apos;il sera pret.
        </p>
        <div className="landing-hero__actions">
          <Link className="landing-btn landing-btn--primary" href="/">
            Retour a l&apos;accueil
          </Link>
          <a className="landing-btn landing-btn--ghost" href="#contact">
            Echanger avec nous
          </a>
        </div>
      </section>
    </main>
  );
}
