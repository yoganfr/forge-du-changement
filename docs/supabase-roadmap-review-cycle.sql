-- EPIC 3 · REF-7b.2 — Cycle de revue (reviewers + feedbacks + deadline)
-- À appliquer sur le projet Supabase après revue des policies avec la matrice permissions.
-- Spec métier : docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md

-- ---------------------------------------------------------------------------
-- Colonne deadline sur le snapshot (si pas déjà présente)
-- ---------------------------------------------------------------------------
alter table public.roadmap_snapshots add column if not exists review_deadline timestamptz null;

-- ---------------------------------------------------------------------------
-- Table reviewers (une ligne par reviewer invité sur un snapshot)
-- ---------------------------------------------------------------------------
create table if not exists public.roadmap_snapshot_reviewers (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.roadmap_snapshots(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'draft', 'submitted', 'closed')),
  invited_at timestamptz not null default now(),
  submitted_at timestamptz null,
  closed_at timestamptz null,
  invited_by uuid null references public.users(id) on delete set null,
  invited_by_email text null,
  unique (snapshot_id, user_id)
);

create index if not exists roadmap_snapshot_reviewers_snapshot_idx
  on public.roadmap_snapshot_reviewers (snapshot_id);

-- ---------------------------------------------------------------------------
-- Feedbacks unifiés (réaction / demande de décision / proposition chantier)
-- ---------------------------------------------------------------------------
create table if not exists public.roadmap_review_feedbacks (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.roadmap_snapshots(id) on delete cascade,
  reviewer_user_id uuid not null references public.users(id) on delete cascade,
  kind text not null check (kind in ('reaction', 'decision', 'proposition_chantier')),
  target_type text not null check (target_type in ('projet', 'chantier', 'jalon', 'raci_chantier', 'proposition')),
  target_id uuid null,
  comment text null,
  constat text null,
  proposition text null,
  benefice text null,
  projet_pere_id uuid null,
  axe text null check (axe in ('PROCESSUS','ORGANISATION','OUTILS','KPI')),
  titre_chantier text null,
  codir_status text null check (codir_status in ('pending','noted','ok','nok','sous_condition')),
  codir_motivation text null,
  codir_user_id uuid null references public.users(id) on delete set null,
  codir_at timestamptz null,
  parent_id uuid null references public.roadmap_review_feedbacks(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists roadmap_review_feedbacks_snapshot_idx
  on public.roadmap_review_feedbacks (snapshot_id);

create index if not exists roadmap_review_feedbacks_reviewer_idx
  on public.roadmap_review_feedbacks (snapshot_id, reviewer_user_id);

-- Si la table existait déjà sans `raci_chantier` :
-- alter table public.roadmap_review_feedbacks drop constraint if exists roadmap_review_feedbacks_target_type_check;
-- alter table public.roadmap_review_feedbacks add constraint roadmap_review_feedbacks_target_type_check
--   check (target_type in ('projet', 'chantier', 'jalon', 'raci_chantier', 'proposition'));

-- ---------------------------------------------------------------------------
-- RLS — à compléter selon `docs/proposition-regles-matrice-permissions.md`
-- Esquisse : reviewer lit/écrit ses lignes ; CODIR lit tout le snapshot concerné.
-- ---------------------------------------------------------------------------
alter table public.roadmap_snapshot_reviewers enable row level security;
alter table public.roadmap_review_feedbacks enable row level security;

-- TODO policies explicites (ne pas laisser « all » en production)
