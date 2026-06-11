-- EPIC 3 · REF-7b.2 — Cycle de revue (reviewers + feedbacks + deadline)
-- Appliqué sur le projet Supabase le 11 juin 2026.
-- Spec métier : docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md
--
-- Migrations appliquées :
--   - 20260506184925_ref_7b2_roadmap_review_cycle (schema initial)
--   - 20260611094832_ref7b2_add_reaction_acknowledged_at
--   - 20260611094845_ref7b2_policy_feedbacks_insert
--   - 20260611094928_ref7b2_cleanup_old_insert_policy
--   - 20260611094942_ref7b2_policy_feedbacks_select_v2
--   - 20260611094959_ref7b2_policy_feedbacks_update
--   - 20260611095008_ref7b2_policy_delete_feedbacks_and_reviewers
--   - 20260611095033_ref7b2_audit_triggers

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
  updated_at timestamptz not null default now(),
  -- REF-7b.2 (11 juin 2026) : colonne pour marquer une reaction comme lue par le CODIR
  reaction_acknowledged_at timestamptz null
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
-- RLS — source de vérité versionnée : `supabase/migrations/*ref_7b2_roadmap_review_cycle*.sql`
-- (policies complètes appliquées sur la prod Supabase ; aligner ce fichier si le schéma diverge.)
-- ---------------------------------------------------------------------------
alter table public.roadmap_snapshot_reviewers enable row level security;
alter table public.roadmap_review_feedbacks enable row level security;

-- ---------------------------------------------------------------------------
-- Policies RLS (appliquées 11 juin 2026)
-- ---------------------------------------------------------------------------

-- roadmap_review_feedbacks : INSERT
-- Reviewer peut insérer seulement si son statut est 'draft'
create policy "Reviewer can insert own feedback" on public.roadmap_review_feedbacks
  for insert to public
  with check (
    reviewer_user_id = current_app_user_id()
    and exists (
      select 1 from public.roadmap_snapshot_reviewers rsr
      where rsr.snapshot_id = roadmap_review_feedbacks.snapshot_id
        and rsr.user_id = current_app_user_id()
        and rsr.status = 'draft'
    )
  );

-- roadmap_review_feedbacks : SELECT
-- Reviewer voit ses propres feedbacks ; CODIR/consultant voit seulement après soumission
create policy roadmap_review_feedbacks_select on public.roadmap_review_feedbacks
  for select to public
  using (
    is_platform_superadmin()
    or reviewer_user_id = current_app_user_id()
    or (
      exists (
        select 1 from public.roadmap_snapshot_reviewers rsr
        where rsr.snapshot_id = roadmap_review_feedbacks.snapshot_id
          and rsr.user_id = roadmap_review_feedbacks.reviewer_user_id
          and rsr.status in ('submitted', 'closed')
      )
      and exists (
        select 1 from public.roadmap_snapshots rs
        where rs.id = roadmap_review_feedbacks.snapshot_id
          and (rs.workspace_id = current_member_workspace_id() or has_workspace_consultant_access(rs.workspace_id))
      )
    )
  );

-- roadmap_review_feedbacks : UPDATE
-- Reviewer peut éditer réactions (si pas lues) ou décisions/propositions (si draft)
-- CODIR/consultant peut modifier pour arbitrage
create policy roadmap_review_feedbacks_update on public.roadmap_review_feedbacks
  for update to public
  using (
    is_platform_superadmin()
    or exists (
      select 1 from public.roadmap_snapshots rs
      where rs.id = roadmap_review_feedbacks.snapshot_id
        and (
          has_workspace_consultant_access(rs.workspace_id)
          or is_workspace_org_admin(rs.workspace_id)
          or (rs.workspace_id = current_member_workspace_id() and exists (
            select 1 from public.users u
            where u.id = current_app_user_id()
              and u.workspace_id = rs.workspace_id
              and u.role in ('codir', 'pilote')
          ))
        )
    )
    or (
      reviewer_user_id = current_app_user_id()
      and (
        (kind = 'reaction' and reaction_acknowledged_at is null)
        or (kind in ('decision', 'proposition_chantier') and exists (
          select 1 from public.roadmap_snapshot_reviewers rsr
          where rsr.snapshot_id = roadmap_review_feedbacks.snapshot_id
            and rsr.user_id = current_app_user_id()
            and rsr.status = 'draft'
        ))
      )
    )
  );

-- roadmap_review_feedbacks : DELETE
-- Superadmin et consultant seulement
create policy roadmap_review_feedbacks_delete on public.roadmap_review_feedbacks
  for delete to public
  using (
    is_platform_superadmin()
    or exists (
      select 1 from public.roadmap_snapshots rs
      where rs.id = roadmap_review_feedbacks.snapshot_id
        and has_workspace_consultant_access(rs.workspace_id)
    )
  );

-- roadmap_snapshot_reviewers : DELETE
-- Superadmin et consultant seulement
create policy roadmap_snapshot_reviewers_delete on public.roadmap_snapshot_reviewers
  for delete to public
  using (
    is_platform_superadmin()
    or exists (
      select 1 from public.roadmap_snapshots rs
      where rs.id = roadmap_snapshot_reviewers.snapshot_id
        and has_workspace_consultant_access(rs.workspace_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Triggers d'audit (appliqués 11 juin 2026)
-- ---------------------------------------------------------------------------

-- Trigger : reviewer_submitted (quand status passe à 'submitted')
create or replace function audit_reviewer_submitted() returns trigger as $$
declare ws_id uuid;
begin
  if NEW.status = 'submitted' and (OLD.status is null or OLD.status != 'submitted') then
    select rs.workspace_id into ws_id from public.roadmap_snapshots rs where rs.id = NEW.snapshot_id;
    insert into public.audit_events (workspace_id, actor_user_id, action, payload)
    values (ws_id, NEW.user_id, 'reviewer_submitted',
      jsonb_build_object('snapshot_id', NEW.snapshot_id, 'reviewer_user_id', NEW.user_id, 'submitted_at', NEW.submitted_at));
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_audit_reviewer_submitted
  after update on public.roadmap_snapshot_reviewers
  for each row execute function audit_reviewer_submitted();

-- Trigger : snapshot_review_reopened (quand status passe de 'submitted' à 'draft')
create or replace function audit_reviewer_reopened() returns trigger as $$
declare ws_id uuid;
begin
  if NEW.status = 'draft' and OLD.status = 'submitted' then
    select rs.workspace_id into ws_id from public.roadmap_snapshots rs where rs.id = NEW.snapshot_id;
    insert into public.audit_events (workspace_id, actor_user_id, action, payload)
    values (ws_id, current_app_user_id(), 'snapshot_review_reopened',
      jsonb_build_object('snapshot_id', NEW.snapshot_id, 'reviewer_user_id', NEW.user_id, 'reopened_by', current_app_user_id()));
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_audit_reviewer_reopened
  after update on public.roadmap_snapshot_reviewers
  for each row execute function audit_reviewer_reopened();

-- Trigger : feedback_arbitrated (quand codir_status change)
create or replace function audit_feedback_arbitrated() returns trigger as $$
declare ws_id uuid;
begin
  if NEW.codir_status is not null and (OLD.codir_status is null or OLD.codir_status != NEW.codir_status) then
    select rs.workspace_id into ws_id from public.roadmap_snapshots rs where rs.id = NEW.snapshot_id;
    insert into public.audit_events (workspace_id, actor_user_id, action, payload)
    values (ws_id, NEW.codir_user_id, 'feedback_arbitrated',
      jsonb_build_object('feedback_id', NEW.id, 'snapshot_id', NEW.snapshot_id, 'reviewer_user_id', NEW.reviewer_user_id,
        'kind', NEW.kind, 'codir_status', NEW.codir_status, 'codir_motivation', NEW.codir_motivation,
        'arbitrated_by', NEW.codir_user_id, 'arbitrated_at', NEW.codir_at));
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_audit_feedback_arbitrated
  after update on public.roadmap_review_feedbacks
  for each row execute function audit_feedback_arbitrated();
