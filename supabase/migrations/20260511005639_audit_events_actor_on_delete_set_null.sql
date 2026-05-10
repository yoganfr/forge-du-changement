-- Retrait membre : permettre DELETE sur public.users lorsque l'utilisateur a des lignes
-- dans audit_events en tant qu'acteur (ex. snowie94 a lui-même généré des événements).
--
-- Avant : FK `audit_events_actor_user_id_fkey` sans action ON DELETE → erreur
--   update or delete on table "users" violates foreign key constraint
--   "audit_events_actor_user_id_fkey" on table "audit_events"
--
-- Comportement cible : conserver les lignes d'audit (traçabilité workspace) et
-- dissocier l'acteur supprimé (`actor_user_id` → NULL). Les types app prévoient
-- déjà `actor_user_id: string | null`.

ALTER TABLE public.audit_events
  ALTER COLUMN actor_user_id DROP NOT NULL;

ALTER TABLE public.audit_events
  DROP CONSTRAINT IF EXISTS audit_events_actor_user_id_fkey;

ALTER TABLE public.audit_events
  ADD CONSTRAINT audit_events_actor_user_id_fkey
  FOREIGN KEY (actor_user_id)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

COMMENT ON CONSTRAINT audit_events_actor_user_id_fkey ON public.audit_events IS
  'Quand un utilisateur est retiré (DELETE users), les événements qu''il a créés restent ; l''acteur est anonymisé (NULL).';
