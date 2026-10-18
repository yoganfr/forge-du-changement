-- APPLIQUÉE le 18 octobre 2026, 23 h 41 (Europe/Paris)
-- sur le projet Supabase forge-du-changement (kpgkxeilddeyfwiiqaha).
--
-- Un seul espace sert de vitrine au site public.
-- Les espaces d'essai ou de clients ne sont pas publiés par ce marquage.

ALTER TABLE public.workspaces
  ADD COLUMN is_showcase boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX workspaces_single_showcase
  ON public.workspaces (is_showcase)
  WHERE is_showcase;

INSERT INTO public.workspaces (
  company_name,
  is_showcase,
  is_public,
  archived,
  current_step_codir
)
VALUES (
  'Entreprise de démonstration',
  true,
  false,
  false,
  1
);
