# OWASP audit — ASVS 5.0.0

Dernière mise à jour : **1 novembre 2026**, 15 h 17 (Europe/Paris)

Référence : [OWASP ASVS 5.0.0](https://github.com/OWASP/ASVS/tree/v5.0.0) (mai 2025).

## Portée

Lecture du dépôt au regard d’OWASP ASVS 5.0.0. Ce n’est pas un audit certifié : chaque exigence du document n’a pas été rejouée. Les en-têtes du tableau de bord dans `vercel.json` ont été relus. Le plafond d’e-mails Auth a été lu le 1 novembre 2026. Les avertisseurs Supabase ont été relus le 1 novembre 2026, 15 h 17.

Pour ce SaaS multi-entreprises, le bon objectif est le **niveau 2** : données d’entreprise, plusieurs clients. Le niveau 3 (menace ciblée, revues formelles, chiffrement applicatif des champs) n’est pas le prochain palier utile.

## Déjà aligné

| Chapitre ASVS 5.0 | Ce qui tient |
|---|---|
| **V6 Authentification**, **V10 OAuth** | Connexion Supabase (mot de passe, lien magique, Google). MFA sur les comptes super-admin. |
| **V8 Autorisation** | Les droits métier passent par la RLS et des fonctions (`can_manage_workspace`, `can_access_workspace`), pas par un rôle décidé dans le navigateur. La clé secrète Supabase n’est pas dans le client Vite. |
| **V2 Validation** | Les images sont filtrées (type, 10 Mo, refus du SVG). L’analyse de discours valide le JSON avec Zod. |
| **V5 Fichiers** | Le dossier n’est plus public. L’affichage passe par un lien temporaire. |
| **V14 / V16** | Un journal `audit_events` existe. La RLS empêche déjà une personne connectée de modifier ou d’effacer une trace. |
| **V3, en partie, sur le site public** | `web/next.config.ts` envoie HSTS, `X-Content-Type-Options`, `Referrer-Policy`, et une CSP qui bloque l’encadrement, `object-src` et les formulaires vers un autre site. |

## À modifier, dans l’ordre

### 1. V5 Fichiers et V8 Autorisation — le dossier photos

Fermé le 1 novembre 2026 par REF-103. Une personne connectée ne voit plus que les logos de son entreprise, et sa propre photo.

### 2. V3 Frontend et V13 Configuration — en-têtes du tableau de bord

Fermé le 1 novembre 2026. `vercel.json` envoie HSTS, `nosniff`, `frame-ancestors` et une politique de script limitée aux fichiers de l’application plus l’empreinte du thème. En local seulement, Vite a le droit d’injecter son script, sinon la page reste blanche. L’aperçu et Vercel restent stricts. Le script du site public reste en observation : le cadre de page ajoute d’autres scripts que celui du thème.

### 3. V4 API — origine des fonctions

Fermé le 1 novembre 2026. `discours-analyze` et `remove-member-auth-cleanup` n’acceptent plus tous les sites. Restent les deux applications et l’adresse locale. La session et le contrôle d’entreprise restent.

### 4. V16 Journal et V6 anti-automatisation

REF-104 est fait le 1 novembre 2026 : une personne connectée ne peut plus modifier ni effacer l’historique. Le plafond des liens de connexion est le réglage Supabase Auth, pas un nouveau plafond dans le navigateur. Il a été lu le 1 novembre 2026 : 30 e-mails par heure. Le refus des mots de passe déjà compromis reste éteint, parce que le projet est sur l’offre gratuite.

### 5. V1 Encodage

Le `dangerouslySetInnerHTML` du thème et du JSON-LD est borné (script fixe, JSON échappé). Il ne faut pas étendre ce motif à un texte saisi par un utilisateur. Le tableau de bord a maintenant une politique de script. Le site public la garde en observation.

### 6. V13 Secrets

Fermé le 1 novembre 2026. `recovery-codes vercel.txt` est ignoré par Git. Les codes de secours Vercel restent des secrets de compte.

### 7. V14 Données et V15 Preuves

Pas de durée de conservation ni d’export/effacement des données personnelles dans le code. La CI lance les tests et, depuis le 1 novembre 2026, un rapport de dépendances qui ne bloque pas la publication. Le lint racine est resté dehors à cause de quatre erreurs anciennes.

## Ce qui peut attendre

Le MD5 ne sert qu’à l’adresse Gravatar, pas à stocker un mot de passe. La cryptographie de session est celle de Supabase et de TLS.

## Relecture du 1 novembre 2026, 15 h 17

Relu après les trois tranches et l’enregistrement à la volée de la fiche entreprise. Les avertisseurs Supabase du projet ont été relus à ce moment.

| Sujet | État |
|---|---|
| En-têtes du tableau de bord | Fermés. Stricts sur Vercel et sur l’aperçu. Souples seulement sur le serveur local. |
| Origine des deux fonctions | Fermée. |
| Dossier photos | Fermé, puis plafonné à 10 Mo et aux images. Le type envoyé suit le fichier, y compris un HEIC sans type déclaré. |
| Historique | Fermé. Une personne connectée ne réécrit plus une trace. |
| E-mails de connexion | 30 par heure. Inchangé. Aucun e-mail envoyé. |
| Mots de passe déjà compromis | Toujours éteint. L’offre gratuite ne propose pas ce réglage. |
| Codes de secours | Ignorés par Git. |
| Dépendances | Rapport dans la porte qualité, sans bloquer. |
| Script du site public | Toujours en observation. |
| 22 fonctions sensibles | Toujours appelables par une personne connectée. C’est voulu : droits et déclencheurs. L’anonyme ne les appelle plus. L’avertisseur les signale encore, sans nom nouveau. |
| Fiche entreprise | L’enregistrement à la volée passe par la même mise à jour, donc par les mêmes droits. Un nom vide n’est pas envoyé. Le nom de fichier du logo est nettoyé. |

Rien de nouveau à corriger tout de suite.

## Suite utile

EPIC 18 est terminé. Les trois tranches de [plan-suite-apres-owasp.md](plan-suite-apres-owasp.md) sont traitées. Le refus des mots de passe compromis attend une offre payante. Le script du site public attend un essai sur une prévisualisation. Le fil revue n’est pas mélangé.
