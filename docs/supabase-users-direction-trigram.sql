-- 2026-04-21 : REF-7b.0 fondations utilisateur pour cycle de review roadmap.
--
-- Objectif :
-- - rattacher les utilisateurs a une direction explicite (`users.direction_id`)
-- - stocker un trigramme d'affichage (`users.trigram`)
-- - definir une convention de derivation par workspace (`workspaces.trigram_convention`)
-- - transporter ces infos des l'invitation (`invitations.direction_id`, `invitations.trigram`)

alter table public.users
  add column if not exists direction_id uuid null references public.directions(id) on delete set null;

alter table public.users
  add column if not exists trigram text null;

alter table public.workspaces
  add column if not exists trigram_convention text not null default 'prenom_nom_3';

alter table public.workspaces
  drop constraint if exists workspaces_trigram_convention_check;

alter table public.workspaces
  add constraint workspaces_trigram_convention_check
  check (trigram_convention in ('prenom_nom_3', 'nom_prenom_3', 'custom'));

alter table public.invitations
  add column if not exists direction_id uuid null references public.directions(id) on delete set null;

alter table public.invitations
  add column if not exists trigram text null;

create index if not exists users_direction_id_idx on public.users(direction_id);
create index if not exists invitations_direction_id_idx on public.invitations(direction_id);
