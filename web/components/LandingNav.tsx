"use client";

/**
 * Barre d’accueil alignée sur le modèle src/App.tsx + src/App.css :
 * grille 3 zones, bouton menu affiché uniquement en CSS sous max-width 768px,
 * panneau mobile fixed + backdrop (comme dashboard__mobile-nav-layer).
 */

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

const MEMBER_SIGNIN_URL = "/acces-membres";
const RDV_HASH = "/#rdv";

export function LandingNav() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuPanelId = useId();

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileNav();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen, closeMobileNav]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 769px)");
    const onChange = () => {
      if (mq.matches) setMobileNavOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /*
   * La couche mobile doit être hors du <header> : le backdrop-filter du header crée un bloc
   * d’ancrage et confine position:fixed à la hauteur de la barre (scroll / overlay déformé).
   */
  return (
    <>
      <header className="landing-nav">
        <div className="landing-nav__inner">
          <Link className="landing-brand" href="/">
            <span className="landing-brand__mark" aria-hidden>
              LF
            </span>
            <span className="landing-brand__text">La Forge du Changement</span>
          </Link>

          <div className="landing-nav__cluster" role="group" aria-label="Actions principales">
            <Link className="landing-nav__cta landing-nav__cta--desktop" href={RDV_HASH}>
              Prendre rendez-vous
            </Link>
            <div className="landing-nav__member-access">
              <span className="landing-nav__member-label">Déjà membre ?</span>
              <a className="landing-nav__member-pill" href={MEMBER_SIGNIN_URL}>
                Se connecter
              </a>
            </div>
          </div>

          <ThemeToggle />

          <button
            type="button"
            className="landing-nav__menu-btn"
            aria-label={mobileNavOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileNavOpen}
            aria-haspopup="dialog"
            aria-controls={mobileNavOpen ? menuPanelId : undefined}
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            <span className="landing-nav__menu-bars" aria-hidden>
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </header>

      {mobileNavOpen ? (
        <div className="landing-nav__mobile-layer" role="presentation">
          <button
            type="button"
            className="landing-nav__mobile-backdrop"
            aria-label="Fermer le menu"
            onClick={closeMobileNav}
          />
          <div
            id={menuPanelId}
            className="landing-nav__mobile-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="landing-nav__mobile-head">
              <span className="landing-nav__mobile-title">Menu</span>
              <button type="button" className="landing-nav__mobile-close" onClick={closeMobileNav} aria-label="Fermer">
                ✕
              </button>
            </div>
            <div className="landing-nav__mobile-body">
              <Link className="landing-nav__cta" href={RDV_HASH} onClick={closeMobileNav}>
                Prendre rendez-vous
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
