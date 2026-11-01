# Plan — Fiabiliser la suite, après l’audit OWASP

Dernière mise à jour : **1 novembre 2026**, 15 h 17 (Europe/Paris)

Statut : tranches A, B et C traitées. Une relecture le 1 novembre 2026, 15 h 17, ne trouve pas de trou nouveau. Le refus des mots de passe compromis reste bloqué par l’offre gratuite. Le script du site public reste en observation. Le fil revue n’est pas mélangé. L’enregistrement à la volée de la fiche entreprise est hors de ce plan : il réutilise la même mise à jour, sans nouveau droit.

Source : [docs/OWASP audit.md](OWASP%20audit.md), revu dans le code le 1 novembre 2026. Ce n’est pas un audit certifié.

## Ce que la passe change par rapport à l’audit écrit

- Le dossier photos et l’historique sont fermés (EPIC 18). On ne les rouvre pas.
- Le plafond des liens de connexion n’est pas seulement dans le navigateur. Le code le dit : le garde-fou principal est le réglage Supabase Auth. Le navigateur évite le double-clic. On vérifie le réglage. On ne reconstruit pas un plafond.
- Les deux fonctions (`discours-analyze`, `remove-member-auth-cleanup`) exigent déjà une session, et l’analyse du discours vérifie l’entreprise. L’ouverture à tous les sites reste à resserrer. Ce n’est pas un trou du même ordre que l’ancien dossier photos : le jeton n’est pas dans un cookie lisible par un autre site.
- Le tableau de bord a un petit script dans la page, pour le thème. Une politique de script trop stricte, copiée telle quelle, casserait l’affichage. Il faut l’autoriser par empreinte, comme sur le site public.
- Le fichier des codes de secours Vercel n’apparaît plus dans les fichiers en cours. On vérifie qu’il a disparu, et on empêche qu’il revienne.
- L’avertisseur Supabase signale 22 fonctions sensibles appelables sans être connecté, 4 fonctions sans chemin de recherche fixé, et la protection des mots de passe déjà compromis désactivée. Les fonctions qui servent aux droits des personnes connectées ne doivent pas perdre ce droit : sinon les écrans cassent.

## Principe

Le produit reprend. Le prochain sujet métier est **REF-7b.4** : recette du masquage, puis commit. Ce plan-ci se glisse en tranches courtes, sans mélanger les fichiers de la revue.

Chaque tranche s’arrête. Le SQL de retour arrière est écrit avant d’être appliqué. On ne découpe pas les gros fichiers. Une règle de sécurité n’est pas un refactor.

## Tranche A — faite le 1 novembre 2026, 14 h 17

Petites, sans changer un écran métier. Fait :

1. **Codes de secours.** Confirmer que `recovery-codes vercel.txt` n’est plus dans le dossier. Ajouter une ignore Git pour ce nom. Ne pas lire ni coller les codes.
2. **En-têtes du tableau de bord.** `vercel.json` ne fait aujourd’hui que renvoyer vers `index.html`. Ajouter les mêmes protections que le site public : pas d’encadrement, pas de type deviné, origine des liens limitée, HTTPS forcé. Pour les scripts : autoriser les fichiers de l’application et l’empreinte du script de thème. Vérifier en clair et en sombre, puis au rechargement.
3. **Origine des deux fonctions.** Remplacer « tous les sites » par les deux adresses de l’application (tableau de bord et site public), plus l’adresse locale le temps des essais. La session et le contrôle d’entreprise restent.
4. **Fonctions de la base.** Retirer l’exécution anonyme sur les fonctions sensibles. Retirer aussi l’exécution aux personnes connectées seulement pour celles qui ne servent que de déclencheur. Garder l’exécution aux personnes connectées pour les fonctions de droit (`can_access_workspace`, `can_manage_workspace`, et celles du même genre). Fixer le chemin de recherche des quatre fonctions signalées. Écrire le SQL inverse avant. Si un écran ne charge plus, on s’arrête et on revient en arrière.

Résultat : une personne non connectée ne peut plus appeler ces fonctions. Une personne connectée le peut encore, y compris les déclencheurs, sinon un enregistrement casserait. Le compte admin de World Company voit encore son entreprise. Le thème clair et sombre a été essayé sur le tableau de bord local. Les protections de page partent avec le prochain déploiement Vercel. Les deux fonctions n’acceptent plus tous les sites. L’analyse du discours est publiée : une origine locale est acceptée, une origine inconnue ne l’est pas.

## Tranche B — réglages, pas de code métier

À faire dans les tableaux Supabase, sans déploiement.

1. Vérifier que le plafond d’envoi des liens de connexion est actif.
2. Activer le refus des mots de passe déjà compromis.

Résultat, lu le 1 novembre 2026, 14 h 39, sans envoyer d’e-mail : la ligne « Rate limit for sending emails » vaut **30**. C’est un plafond horaire. On ne le change pas. Le refus des mots de passe déjà compromis n’est proposé que sur l’offre payante. L’organisation est sur l’offre gratuite, donc ce réglage reste éteint.

## Tranche C — faite le 1 novembre 2026, 14 h 43

1. **Alertes de dépendances.** Un rapport dans la CI, qui ne bloque pas la publication. Même leçon que le lint : on n’ajoute pas un feu rouge déjà allumé.
2. **Script du site public.** Il reste en observation. Le cadre du site ajoute d’autres scripts que celui du thème. Le passer en bloquant sans essai sur une prévisualisation casserait la page.
3. **Taille des fichiers dans le dossier.** Le dossier `assets` accepte au plus 10 Mo, et seulement JPEG, PNG, WebP, GIF, HEIC. Les six fichiers déjà là sont en dessous, en JPEG ou PNG. Le retour arrière remet l’absence de plafond et de liste de types.

## Plus tard, avant un premier client payant

Déjà écrit dans [docs/sécurité à venir.md](s%C3%A9curit%C3%A9%20%C3%A0%20venir.md). On ne les avance pas maintenant.

- Une sauvegarde déjà restaurée une fois.
- L’export puis l’effacement des données d’une entreprise qui part.
- Une feuille : que fait-on si un compte est volé.
- Un regard extérieur, juste avant le premier client payant.
- La veille des nouvelles clés Supabase (**REF-47a**) reste une veille.

## Fichier de règles : oui, un seul, court

Les règles déjà là couvrent des sujets différents. On n’en ajoute pas une qui répète le style, le refactor ou les couleurs.

| Déjà là | Ce qu’elle décide |
|---|---|
| `docs/refactor_rules.md` | Quand ne pas déplacer le code |
| `docs/visual-coherence-theme-rules.md` | Couleurs, textes, espacements |
| `docs/proposition-regles-matrice-permissions.md` | Qui voit quel écran |
| `.cursor/rules/` | Comment l’agent travaille, Git, Supabase, l’heure |

Ce qui manque : une page que l’agent lit avant d’ajouter une fonction, un en-tête ou un secret. Pas un guide de style.

Proposition : `docs/regles-securite-codage.md`, une page, huit règles.

1. Une règle de sécurité n’est pas un refactor.
2. Pas de jeton secret dans le navigateur, ni de fichier de codes dans le dépôt.
3. Une fonction nouvelle dit qui peut l’exécuter. L’anonyme n’exécute pas une fonction sensible.
4. Les fonctions de droit gardent `search_path` fixé, et restent appelables par les personnes connectées.
5. Les deux applications envoient les en-têtes de protection. On ne copie pas une politique de script sans l’empreinte du script de thème.
6. Une fonction appelée depuis le navigateur n’accepte pas tous les sites. Elle vérifie la session et l’entreprise.
7. `dangerouslySetInnerHTML` ne reçoit pas un texte saisi par une personne.
8. Le SQL de retour arrière est écrit avant d’appliquer une règle. Le lint déjà rouge n’entre pas dans la CI pour la faire taire.

La page existe : [docs/regles-securite-codage.md](regles-securite-codage.md). Elle est dans la lecture des agents, à côté des règles de refactor.

## Hors de ce plan

Pas de nouveau module. Pas de découpage de fichiers. Pas de mélange avec le masquage de la revue. Pas de changement de qui lit ou qui ajoute une trace.
