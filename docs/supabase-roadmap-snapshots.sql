-- EPIC 3 · REF-7a
-- Snapshot roadmap versionnee (V1 figee) + items chantiers/jalons

create table if not exists public.roadmap_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  projet_id uuid null references public.projets(id) on delete set null,
  label text not null,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'closed')),
  frozen_at timestamptz not null default now(),
  closed_at timestamptz null,
  created_by uuid null references public.users(id) on delete set null,
  created_by_email text null,
  created_at timestamptz not null default now()
);

-- Back-fill script si la colonne a été ajoutée après coup :
-- alter table public.roadmap_snapshots add column if not exists created_by_email text;
-- update public.roadmap_snapshots rs set created_by_email = u.email from public.users u where rs.created_by = u.id and rs.created_by_email is null;

create index if not exists roadmap_snapshots_workspace_created_idx
  on public.roadmap_snapshots (workspace_id, created_at desc);

create table if not exists public.roadmap_snapshot_items (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.roadmap_snapshots(id) on delete cascade,
  kind text not null check (kind in ('chantier', 'jalon')),
  source_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists roadmap_snapshot_items_snapshot_idx
  on public.roadmap_snapshot_items (snapshot_id, kind);

alter table public.roadmap_snapshots enable row level security;
alter table public.roadmap_snapshot_items enable row level security;

drop policy if exists roadmap_snapshots_select on public.roadmap_snapshots;
create policy roadmap_snapshots_select
  on public.roadmap_snapshots
  for select
  using (workspace_id = public.current_member_workspace_id() or public.is_platform_superadmin());

drop policy if exists roadmap_snapshots_insert on public.roadmap_snapshots;
create policy roadmap_snapshots_insert
  on public.roadmap_snapshots
  for insert
  with check (
    public.is_platform_superadmin()
    or public.is_workspace_org_admin(workspace_id)
    or public.has_workspace_consultant_access(workspace_id)
  );

drop policy if exists roadmap_snapshot_items_select on public.roadmap_snapshot_items;
create policy roadmap_snapshot_items_select
  on public.roadmap_snapshot_items
  for select
  using (
    exists (
      select 1
      from public.roadmap_snapshots rs
      where rs.id = snapshot_id
        and (rs.workspace_id = public.current_member_workspace_id() or public.is_platform_superadmin())
    )
  );

drop policy if exists roadmap_snapshot_items_insert on public.roadmap_snapshot_items;
create policy roadmap_snapshot_items_insert
  on public.roadmap_snapshot_items
  for insert
  with check (
    exists (
      select 1
      from public.roadmap_snapshots rs
      where rs.id = snapshot_id
        and (
          public.is_platform_superadmin()
          or public.is_workspace_org_admin(rs.workspace_id)
          or public.has_workspace_consultant_access(rs.workspace_id)
        )
    )
  );

-- UPDATE — ouverture / fermeture de revue (statut draft ↔ in_review). Livré dans la migration REF-7b.2 :
-- `supabase/migrations/20260506120000_ref_7b2_roadmap_review_cycle.sql`
-- À appliquer sur Supabase si la fermeture de revue ne persiste pas (0 ligne mise à jour côté client).
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
