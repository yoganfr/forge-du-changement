-- 2026-04-21 : REF-7b.1 matrice PCI (Pilote/Contributeur/Informe) par chantier.
--
-- Objectif :
-- - stocker les parties prenantes impliquees sur chaque chantier (matrice cochable cote MaturityRoadmap)
-- - modele stakeholder-centric : 1 ligne = 1 partie prenante (colonne de la matrice UI)
-- - roles PCI multi-coches (is_pilote / is_contributeur / is_informe)
-- - simplification du RACI classique (P combine R+A ; C = consulte/contribue ; I = informe)
-- - motivation texte libre pour documenter pourquoi la partie prenante est impliquee
-- - entite obligatoire (Direction ou Autre) avec lien optionnel vers public.directions
-- - personne optionnelle (Nom Prenom texte libre) avec lien optionnel vers public.users
--
-- RLS : meme pattern que raci_jalons (via jointure sur chantiers). Le scope direction CODIR
-- (lecture cross-direction OK mais ecriture limitee a sa direction) sera enforce cote UI, comme
-- pour les autres tables roadmap, pas cote RLS (coherence avec l'existant).

create table if not exists public.raci_chantiers (
  id uuid primary key default gen_random_uuid(),
  chantier_id uuid not null references public.chantiers(id) on delete cascade,
  -- Entite (obligatoire)
  entite_type text not null check (entite_type in ('direction', 'autre')),
  entite_nom text not null,
  direction_id uuid null references public.directions(id) on delete set null,
  -- Personne (optionnelle)
  personne_nom text null,
  user_id uuid null references public.users(id) on delete set null,
  -- Roles PCI (multi-roles autorises)
  is_pilote boolean not null default false,
  is_contributeur boolean not null default false,
  is_informe boolean not null default false,
  -- Motivation
  motivation text null,
  -- Affichage
  ordre_affichage int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references public.users(id) on delete set null,
  constraint raci_chantier_at_least_one_role
    check (is_pilote or is_contributeur or is_informe)
);

-- Index utiles (jointure via chantier_id, filtres par direction/user)
create index if not exists raci_chantiers_chantier_id_idx on public.raci_chantiers(chantier_id);
create index if not exists raci_chantiers_direction_id_idx on public.raci_chantiers(direction_id);
create index if not exists raci_chantiers_user_id_idx on public.raci_chantiers(user_id);
create index if not exists raci_chantiers_order_idx on public.raci_chantiers(chantier_id, ordre_affichage);

-- RLS activee, meme logique que raci_jalons : acces conditionne a l'acces au chantier parent
alter table public.raci_chantiers enable row level security;

drop policy if exists lf_raci_chantiers_all on public.raci_chantiers;
create policy lf_raci_chantiers_all on public.raci_chantiers
  for all
  using (
    is_platform_superadmin()
    or exists (
      select 1 from public.chantiers c
      where c.id = raci_chantiers.chantier_id
        and (
          has_workspace_consultant_access(c.workspace_id)
          or c.workspace_id = current_member_workspace_id()
        )
    )
  )
  with check (
    is_platform_superadmin()
    or exists (
      select 1 from public.chantiers c
      where c.id = raci_chantiers.chantier_id
        and (
          has_workspace_consultant_access(c.workspace_id)
          or c.workspace_id = current_member_workspace_id()
        )
    )
  );
