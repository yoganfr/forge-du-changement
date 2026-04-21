import { LandingNav } from "@/components/LandingNav";
import { LandingRoadmapTrajectoire } from "@/components/LandingRoadmapTrajectoire";

const RDV_MAILTO =
  "mailto:contact@laforge.fr?subject=Rendez-vous%20%E2%80%94%20transformation";

export default function Home() {
  return (
    <div className="landing-page min-h-svh">
      <LandingNav />

      <main>
        {/* 1. Hero — bloc éditorial large aligné à gauche */}
        <section className="landing-stack landing-stack--hero landing-surface-hero" aria-labelledby="hero-heading">
          <div className="landing-shell">
            <div className="landing-col-hero">
              <h1 id="hero-heading" className="landing-type-hero">
                Vous lancez <span className="landing-type-hero-accent">UNE</span> transformation.
                <br />
                Vos équipes en font déjà 10 différentes.
              </h1>
              <p className="landing-body landing-body-muted landing-hero-sub">
                Le CODIR a validé.
                <br />
                Le terrain diverge.
              </p>
              <p className="landing-body landing-body-muted landing-hero-sub">
                À la fin, personne ne pilote vraiment la même chose.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Constat — colonne étroite */}
        <section className="landing-stack landing-surface-plain" aria-labelledby="constat-heading">
          <div className="landing-shell">
            <div className="landing-col-editorial">
              <h2 id="constat-heading" className="landing-type-section">
                Aujourd&apos;hui, vous avez ça.
              </h2>
              <div className="landing-body landing-body-muted landing-editorial-gap">
                <p>
                  Des discussions.
                  <br />
                  Des intentions.
                  <br />
                  Des slides.
                </p>
                <ul className="landing-list-loose landing-editorial-gap">
                  <li>15 chantiers lancés</li>
                  <li>Des priorités qui changent</li>
                  <li>Des directions qui avancent chacune de leur côté</li>
                </ul>
                <p className="landing-editorial-gap">
                  Tout existe.
                  <br />
                  Mais rien ne tient vraiment ensemble.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Miroir — question centrée, beaucoup d’air */}
        <section className="landing-stack landing-stack--mirror landing-surface-plain" aria-labelledby="miroir-heading">
          <div className="landing-shell">
            <div className="landing-col-strategic landing-centre">
              <p id="miroir-heading" className="landing-type-mirror landing-body-muted">
                Aujourd&apos;hui, si vous réunissez vos directeurs :
              </p>
              <p className="landing-type-mirror landing-mirror-gap">
                Sont-ils capables de décrire
                <br />
                la même transformation ?
              </p>
            </div>
          </div>
        </section>

        {/* 4. Tension — colonne étroite alignée à gauche */}
        <section className="landing-stack landing-surface-plain" aria-labelledby="tension-heading">
          <div className="landing-shell">
            <div className="landing-col-editorial">
              <h2 id="tension-heading" className="sr-only">
                Tension
              </h2>
              <div className="landing-body landing-body-muted">
                <p>Et vous perdez progressivement le contrôle.</p>
                <p className="landing-insight-gap">
                  Chaque direction avance.
                  <br />
                  Chaque équipe interprète.
                </p>
                <p className="landing-insight-gap">
                  Ce qui devait aligner
                  <br />
                  crée encore plus de dispersion.
                </p>
                <p className="landing-insight-gap">
                  Et plus vous lancez d&apos;initiatives,
                  <br />
                  plus le désalignement augmente.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Bascule — bloc contraste, largeur maîtrisée */}
        <section className="landing-stack landing-surface-contrast" aria-labelledby="bascule-heading">
          <div className="landing-shell">
            <div className="landing-col-insight">
              <h2 id="bascule-heading" className="sr-only">
                Bascule
              </h2>
              <p className="landing-type-insight">Ce n&apos;est pas un problème de pilotage.</p>
              <p className="landing-type-insight landing-insight-gap">
                C&apos;est l&apos;absence d&apos;une{" "}
                <strong className="landing-type-insight-accent font-semibold">structure commune</strong> de
                transformation.
              </p>
              <p className="landing-type-insight landing-type-insight-muted landing-insight-gap">
                Et tant qu&apos;elle n&apos;existe pas,
                <br />
                chaque initiative recrée du désalignement.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Structure — intro éditoriale + grille */}
        <section className="landing-stack landing-surface-carded" aria-labelledby="structure-heading">
          <div className="landing-shell">
            <div className="landing-col-editorial">
              <h2 id="structure-heading" className="landing-type-section">
                On ne rajoute pas une couche.
              </h2>
              <p className="landing-body landing-body-muted landing-editorial-gap">
                On construit une colonne vertébrale.
              </p>
            </div>
            <div className="landing-pillar-grid">
              <article className="landing-pillar-card landing-pillar-card--clarify">
                <h3 className="landing-pillar-label">Clarifier</h3>
                <p className="landing-pillar-body">
                  Vous transformez par le sens.
                  <span className="landing-pillar-sub">→ Diagnostic partagé, décisions explicites</span>
                </p>
              </article>
              <article className="landing-pillar-card landing-pillar-card--align">
                <h3 className="landing-pillar-label">Aligner</h3>
                <p className="landing-pillar-body">
                  Qui fait quoi. Quand. Avec qui.
                  <span className="landing-pillar-sub">→ Responsabilités visibles</span>
                </p>
              </article>
              <article className="landing-pillar-card landing-pillar-card--pilot">
                <h3 className="landing-pillar-label">Piloter</h3>
                <p className="landing-pillar-body">
                  Ce qui avance. Ce qui bloque.
                  <span className="landing-pillar-sub">→ Jalons, revues, ajustements</span>
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* 7–8. Preuve visuelle + trajectoire (bloc unique — voir docs/roadmap-section-target.md) */}
        <section
          className="landing-stack landing-surface-roadmap"
          aria-labelledby="preuve-heading trajectoire-heading"
        >
          <div className="landing-shell">
            <div className="landing-proof-head">
              <h2 id="preuve-heading" className="landing-type-section">
                Une transformation visible.
                <br />
                Une seule trajectoire.
                <span className="landing-type-section-muted">Partagée par toutes les directions.</span>
              </h2>
            </div>
            <h2 id="trajectoire-heading" className="landing-type-section landing-roadmap-intro landing-centre">
              Une transformation qui tient dans le temps passe toujours par les mêmes étapes :
            </h2>
            <LandingRoadmapTrajectoire />
            <p className="landing-body landing-body-muted landing-roadmap-foot">
              Chaque étape est un moment collectif.
              <br />
              Pas un automatisme.
            </p>
          </div>
        </section>

        {/* 9. Decision */}
        <section className="landing-stack landing-surface-soft" aria-labelledby="decision-heading">
          <div className="landing-shell">
            <div className="landing-col-strategic landing-centre landing-centre-narrow">
              <h2 id="decision-heading" className="sr-only">
                Moment de décision
              </h2>
              <p className="landing-type-decision landing-type-decision-muted">
                La vraie question n&apos;est pas :
              </p>
              <p className="landing-type-decision landing-decision-gap italic">
                &ldquo;Faut-il lancer une transformation ?&rdquo;
              </p>
              <p className="landing-type-decision landing-type-decision-muted landing-decision-gap-lg">Mais :</p>
              <p className="landing-type-decision landing-decision-gap">
                Avez-vous aujourd&apos;hui une structure
                <br />
                qui permet de la tenir dans le temps ?
              </p>
            </div>
          </div>
        </section>

        {/* 10. CTA */}
        <section id="rdv" className="landing-stack landing-surface-plain scroll-mt-24" aria-labelledby="cta-heading">
          <div className="landing-shell">
            <div className="landing-cta-wrap">
              <h2 id="cta-heading" className="landing-type-section">
                Parlons de votre transformation
              </h2>
              <p className="landing-cta-lead">
                Un échange rapide pour regarder ensemble :
                <br />
                <span className="mt-3 block">— où vous en êtes réellement</span>
                <span className="mt-2 block">— ce qui bloque</span>
                <span className="mt-2 block">— ce qui permettrait d&apos;aligner durablement</span>
              </p>
              <a href={RDV_MAILTO} className="landing-cta-btn">
                Prendre rendez-vous
              </a>
            </div>
          </div>
        </section>

        {/* 11. Filter */}
        <section className="landing-stack landing-stack--filter landing-surface-plain" aria-label="Pour qui">
          <div className="landing-shell">
            <p className="landing-body landing-body-sm landing-body-muted landing-col-strategic text-center">
              Cet échange est particulièrement utile si vous pilotez plusieurs projets de transformation en parallèle.
            </p>
          </div>
        </section>
      </main>

      <footer className="landing-footer-min">
        <div className="landing-shell">
          <p>© {new Date().getFullYear()} La Forge du Changement</p>
        </div>
      </footer>
    </div>
  );
}
