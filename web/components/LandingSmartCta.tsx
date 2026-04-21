"use client";

import { createClient } from "@supabase/supabase-js";
import { useMemo, useState } from "react";

type LandingSmartCtaProps = {
  className?: string;
};

const MEMBER_APP_URL =
  process.env.NEXT_PUBLIC_MEMBER_APP_URL?.trim() || "https://forge-du-changement.vercel.app";

const RDV_MAILTO =
  "mailto:contact@laforge.fr?subject=Rendez-vous%20%E2%80%94%20transformation";

export function LandingSmartCta({ className }: LandingSmartCtaProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return null;
    return createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }, []);

  async function handleAccessClick() {
    setIsChecking(true);
    try {
      if (!supabase) {
        setShowModal(true);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setShowModal(true);
        return;
      }

      window.location.href = `${MEMBER_APP_URL}/?source=landing-web`;
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={handleAccessClick} disabled={isChecking}>
        {isChecking ? "Vérification..." : "Accéder à mon espace"}
      </button>

      {showModal ? (
        <div className="landing-modal-layer" role="dialog" aria-modal="true" aria-label="Connexion requise">
          <button
            type="button"
            className="landing-modal-backdrop"
            aria-label="Fermer la fenêtre"
            onClick={() => setShowModal(false)}
          />
          <div className="landing-modal-card">
            <h3>Connexion requise</h3>
            <p>
              Votre session membre n&apos;est pas détectée sur ce navigateur. Connectez-vous pour accéder à votre
              espace ou prenez rendez-vous pour un accompagnement.
            </p>
            <div className="landing-modal-actions">
              <a className="landing-btn landing-btn--primary" href="/acces-membres">
                Se connecter
              </a>
              <a className="landing-btn landing-btn--ghost" href={RDV_MAILTO}>
                Prendre rendez-vous
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
