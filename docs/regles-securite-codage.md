# Règles de codage — sécurité

Dernière mise à jour : **1 novembre 2026**, 14 h 11 (Europe/Paris)

Page courte, lue avant d’ajouter une fonction, un en-tête ou un secret. Elle ne remplace pas les règles de refactor, de thème, ni la matrice des droits.

Une règle de sécurité n’est pas un refactor. On ne découpe pas un fichier pour l’appliquer.

## Huit règles

1. **Pas de secret dans le dépôt.** La clé qui contourne les droits reste côté serveur. Un fichier de codes de secours n’est ni lu, ni commité, ni collé dans un document.
2. **Qui peut exécuter.** Une fonction sensible nouvelle n’est pas exécutable par une personne non connectée. Les fonctions de droit restent exécutables par les personnes connectées : ce sont elles qui font tenir les écrans.
3. **Chemin de recherche fixé.** Une fonction de droit déclare `search_path`. On ne le laisse pas dépendre du rôle qui l’appelle.
4. **Retour arrière écrit avant.** Avant d’appliquer une règle en base, le SQL qui la défait est dans le fichier de migration.
5. **Les deux applications protègent la page.** Le tableau de bord et le site public envoient les en-têtes : pas d’encadrement, type de fichier non deviné, liens limités, HTTPS forcé. On ne copie pas une politique de script sans l’empreinte du script de thème déjà présent dans la page.
6. **Une fonction appelée par le navigateur n’accepte pas tous les sites.** Elle vérifie la session, et l’entreprise quand l’action porte sur une entreprise.
7. **Pas de HTML saisi.** `dangerouslySetInnerHTML` ne reçoit pas un texte écrit par une personne. Le script de thème et le JSON public déjà échappé restent les seules exceptions.
8. **Un feu déjà rouge ne devient pas une porte.** Le lint racine a des erreurs anciennes. On ne l’ajoute pas à la publication pour le faire taire, et on ne corrige pas le dépôt hors sujet pour ça.

## Où c’est déjà décidé ailleurs

- Déplacer du code : `docs/refactor_rules.md`
- Couleurs et espacements : `docs/visual-coherence-theme-rules.md`
- Qui voit un écran : `docs/proposition-regles-matrice-permissions.md`
- Suite concrète après l’audit : `docs/plan-suite-apres-owasp.md`
