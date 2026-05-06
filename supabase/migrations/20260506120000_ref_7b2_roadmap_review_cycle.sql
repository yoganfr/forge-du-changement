-- REF-7b.2 — Cycle de revue : tables + review_deadline + RLS (aligné prod)
-- Politiques basées sur current_app_user_id(), can_access_workspace et helpers existants.

alter table public.roadmap_snapshots add column if not exists review_deadline timestamptz null;

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

alter table public.roadmap_snapshot_reviewers enable row level security;
alter table public.roadmap_review_feedbacks enable row level security;

-- Snapshots : mise à jour statut / deadline (manquant en prod)
drop policy if exists roadmap_snapshots_update on public.roadmap_snapshots;
create policy roadmap_snapshots_update on public.roadmap_snapshots
  for update
  using (
    public.is_platform_superadmin()
    or public.has_workspace_consultant_access(workspace_id)
    or public.is_workspace_org_admin(workspace_id)
    or (
      workspace_id = public.current_member_workspace_id()
      and exists (
        select 1 from public.users u
        where u.id = public.current_app_user_id()
          and u.workspace_id = roadmap_snapshots.workspace_id
          and u.role in ('codir', 'pilote')
      )
    )
  )
  with check (
    public.is_platform_superadmin()
    or public.has_workspace_consultant_access(workspace_id)
    or public.is_workspace_org_admin(workspace_id)
    or (
      workspace_id = public.current_member_workspace_id()
      and exists (
        select 1 from public.users u
        where u.id = public.current_app_user_id()
          and u.workspace_id = roadmap_snapshots.workspace_id
          and u.role in ('codir', 'pilote')
      )
    )
  );

-- Reviewers
drop policy if exists roadmap_snapshot_reviewers_select on public.roadmap_snapshot_reviewers;
create policy roadmap_snapshot_reviewers_select on public.roadmap_snapshot_reviewers
  for select
  using (
    public.is_platform_superadmin()
    or user_id = public.current_app_user_id()
    or exists (
      select 1 from public.roadmap_snapshots rs
      where rs.id = snapshot_id
        and public.can_access_workspace(rs.workspace_id)
    )
  );

drop policy if exists roadmap_snapshot_reviewers_insert on public.roadmap_snapshot_reviewers;
create policy roadmap_snapshot_reviewers_insert on public.roadmap_snapshot_reviewers
  for insert
  with check (
    public.is_platform_superadmin()
    or exists (
      select 1 from public.roadmap_snapshots rs
      where rs.id = snapshot_id
        and (
          public.has_workspace_consultant_access(rs.workspace_id)
          or public.is_workspace_org_admin(rs.workspace_id)
          or (
            rs.workspace_id = public.current_member_workspace_id()
            and exists (
              select 1 from public.users u
              where u.id = public.current_app_user_id()
                and u.workspace_id = rs.workspace_id
                and u.role in ('codir', 'pilote')
            )
          )
        )
    )
  );

drop policy if exists roadmap_snapshot_reviewers_update on public.roadmap_snapshot_reviewers;
create policy roadmap_snapshot_reviewers_update on public.roadmap_snapshot_reviewers
  for update
  using (
    public.is_platform_superadmin()
    or user_id = public.current_app_user_id()
    or exists (
      select 1 from public.roadmap_snapshots rs
      where rs.id = snapshot_id
        and (
          public.has_workspace_consultant_access(rs.workspace_id)
          or public.is_workspace_org_admin(rs.workspace_id)
          or (
            rs.workspace_id = public.current_member_workspace_id()
            and exists (
              select 1 from public.users u
              where u.id = public.current_app_user_id()
                and u.workspace_id = rs.workspace_id
                and u.role in ('codir', 'pilote')
            )
          )
        )
    )
  )
  with check (
    public.is_platform_superadmin()
    or user_id = public.current_app_user_id()
    or exists (
      select 1 from public.roadmap_snapshots rs
      where rs.id = snapshot_id
        and (
          public.has_workspace_consultant_access(rs.workspace_id)
          or public.is_workspace_org_admin(rs.workspace_id)
          or (
            rs.workspace_id = public.current_member_workspace_id()
            and exists (
              select 1 from public.users u
              where u.id = public.current_app_user_id()
                and u.workspace_id = rs.workspace_id
                and u.role in ('codir', 'pilote')
            )
          )
        )
    )
  );

-- Feedbacks
drop policy if exists roadmap_review_feedbacks_select on public.roadmap_review_feedbacks;
create policy roadmap_review_feedbacks_select on public.roadmap_review_feedbacks
  for select
  using (
    public.is_platform_superadmin()
    or reviewer_user_id = public.current_app_user_id()
    or exists (
      select 1 from public.roadmap_snapshots rs
      where rs.id = snapshot_id
        and (
          rs.workspace_id = public.current_member_workspace_id()
          or public.has_workspace_consultant_access(rs.workspace_id)
          or public.is_platform_superadmin()
        )
    )
  );

drop policy if exists roadmap_review_feedbacks_insert on public.roadmap_review_feedbacks;
create policy roadmap_review_feedbacks_insert on public.roadmap_review_feedbacks
  for insert
  with check (
    reviewer_user_id = public.current_app_user_id()
    and exists (
      select 1 from public.roadmap_snapshot_reviewers rsr
      where rsr.snapshot_id = roadmap_review_feedbacks.snapshot_id
        and rsr.user_id = public.current_app_user_id()
    )
  );

drop policy if exists roadmap_review_feedbacks_update on public.roadmap_review_feedbacks;
create policy roadmap_review_feedbacks_update on public.roadmap_review_feedbacks
  for update
  using (
    public.is_platform_superadmin()
    or reviewer_user_id = public.current_app_user_id()
    or exists (
      select 1 from public.roadmap_snapshots rs
      where rs.id = snapshot_id
        and (
          public.has_workspace_consultant_access(rs.workspace_id)
          or public.is_workspace_org_admin(rs.workspace_id)
          or (
            rs.workspace_id = public.current_member_workspace_id()
            and exists (
              select 1 from public.users u
              where u.id = public.current_app_user_id()
                and u.workspace_id = rs.workspace_id
                and u.role in ('codir', 'pilote')
            )
          )
        )
    )
  )
  with check (
    public.is_platform_superadmin()
    or reviewer_user_id = public.current_app_user_id()
    or exists (
      select 1 from public.roadmap_snapshots rs
      where rs.id = snapshot_id
        and (
          public.has_workspace_consultant_access(rs.workspace_id)
          or public.is_workspace_org_admin(rs.workspace_id)
          or (
            rs.workspace_id = public.current_member_workspace_id()
            and exists (
              select 1 from public.users u
              where u.id = public.current_app_user_id()
                and u.workspace_id = rs.workspace_id
                and u.role in ('codir', 'pilote')
            )
          )
        )
    )
  );
