-- REF-104. Appliquée le 1 novembre 2026, 13 h 57 (Europe/Paris)
-- sur le projet Supabase forge-du-changement (kpgkxeilddeyfwiiqaha).
--
-- Une personne connectée peut toujours lire une trace et en ajouter une.
-- Elle ne peut plus la modifier ni l'effacer, y compris hors des règles de ligne.
-- Le rôle de maintenance (service_role) garde ces deux droits.
--
-- Retour arrière, si ce droit doit revenir aux personnes connectées :
-- GRANT UPDATE, DELETE ON TABLE public.audit_events TO authenticated;

REVOKE UPDATE, DELETE ON TABLE public.audit_events FROM authenticated;
