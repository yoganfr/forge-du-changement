"use client";

/**
 * Bloc trajectoire : route SVG + jalons alignés aux cartes (grille route | pin | connecteur | carte).
 * États par étape : done | current | upcoming (réutilisable homepage workspace).
 * Assets : /public/images/SVG roadmap assets/
 */

import { Fragment, useEffect, useRef } from "react";

const SVG_DIR = "SVG roadmap assets";

function svgPublicUrl(filename: string): string {
  return `/images/${encodeURIComponent(SVG_DIR)}/${encodeURIComponent(filename)}`;
}

export const ROADMAP_SVG = {
  road: svgPublicUrl("SVG roadmap asset Road #2F5B82.svg"),
  pinBlue: svgPublicUrl("SVG roadmap asset pin vector #165BD2.svg"),
  pinRed: svgPublicUrl("SVG roadmap asset pin vector  #E06262.svg"),
  redpoint: svgPublicUrl("SVG roadmap asset redpoint step #EC1515.svg"),
} as const;

export type StepStatus = "done" | "current" | "upcoming";

export type Step = {
  id: number;
  title: string;
  status: StepStatus;
};

/** Titres par défaut (page publique) — même ordre que le produit figé */
export const ROADMAP_STEP_TITLES = [
  "Prioriser les projets transformants",
  "Construire une roadmap claire",
  "Engager les équipes",
  "Décliner en actions concrètes",
  "Lancer réellement",
  "Piloter dans la durée",
] as const;

/** Parcours marketing : toutes les étapes au statut « upcoming » (rendu neutre = avant refonte états) */
export const DEFAULT_LANDING_ROADMAP_STEPS: readonly Step[] = ROADMAP_STEP_TITLES.map((title, i) => ({
  id: i + 1,
  title,
  status: "upcoming" as const,
}));

/** Utile workspace : statuts par index sur les titres landing par défaut (compléter avec « upcoming » si tableau plus court). */
export function buildRoadmapSteps(statuses: readonly StepStatus[]): Step[] {
  return ROADMAP_STEP_TITLES.map((title, i) => ({
    id: i + 1,
    title,
    status: statuses[i] ?? "upcoming",
  }));
}

export type LandingRoadmapTrajectoireProps = {
  /** Étapes avec statut ; défaut = parcours landing (toutes upcoming) */
  steps?: readonly Step[];
  /** Si true et qu’une étape est `current`, scroll doux vers cette carte au montage */
  scrollToCurrentOnMount?: boolean;
};

export function LandingRoadmapTrajectoire({
  steps = DEFAULT_LANDING_ROADMAP_STEPS,
  scrollToCurrentOnMount = true,
}: LandingRoadmapTrajectoireProps) {
  const n = steps.length;
  const currentArticleRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!scrollToCurrentOnMount) return;
    const t = window.requestAnimationFrame(() => {
      currentArticleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(t);
  }, [scrollToCurrentOnMount, steps]);

  return (
    <div
      className="landing-roadmap-grid"
      aria-label={n === 6 ? "Trajectoire en six étapes" : `Trajectoire en ${n} étapes`}
      style={{ gridTemplateRows: `repeat(${n}, auto)` }}
    >
      <div
        className="landing-roadmap-road-cell"
        style={{ gridColumn: 1, gridRow: `1 / span ${n}` }}
        aria-hidden
      >
        <img
          src={ROADMAP_SVG.road}
          alt=""
          width={566}
          height={5293}
          className="landing-roadmap-road-svg"
          decoding="async"
          fetchPriority="low"
        />
      </div>

      {steps.map((step, i) => {
        const rowIndex = i + 1;
        const num = String(step.id).padStart(2, "0");
        const pinSrc = step.status === "current" ? ROADMAP_SVG.pinRed : ROADMAP_SVG.pinBlue;
        const status = step.status;

        return (
          <Fragment key={step.id}>
            <div
              className="landing-roadmap-pin-cell"
              style={{ gridColumn: 2, gridRow: rowIndex }}
              data-step-status={status}
            >
              <span className="landing-roadmap-pin-wrap">
                <img
                  src={pinSrc}
                  alt=""
                  width={175}
                  height={104}
                  className="landing-roadmap-pin-img"
                  decoding="async"
                  fetchPriority="low"
                />
              </span>
            </div>
            <div
              className="landing-roadmap-connector-cell"
              style={{ gridColumn: 3, gridRow: rowIndex }}
              data-step-status={status}
            >
              <span className="landing-roadmap-connector-line" aria-hidden />
            </div>
            <article
              ref={step.status === "current" ? currentArticleRef : undefined}
              className="landing-roadmap-card landing-roadmap-svg-card"
              style={{ gridColumn: 4, gridRow: rowIndex }}
              data-step-status={status}
              aria-current={step.status === "current" ? "step" : undefined}
            >
              <span className="landing-roadmap-num">{num}</span>
              <span className="landing-roadmap-sep" aria-hidden>
                —
              </span>
              <h3 className="landing-roadmap-card-title">{step.title}</h3>
            </article>
          </Fragment>
        );
      })}
    </div>
  );
}
