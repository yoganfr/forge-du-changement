# OWASP audit — ASVS 5.0.0

Dernière mise à jour : **1 novembre 2026**, 13 h 38 (Europe/Paris)

Référence : [OWASP ASVS 5.0.0](https://github.com/OWASP/ASVS/tree/v5.0.0) (mai 2025).

## Portée

Lecture du dépôt au regard d’OWASP ASVS 5.0.0. Ce n’est pas un audit certifié : chaque exigence du document n’a pas été rejouée, et la configuration du tableau Supabase ou de Vercel n’a pas été inspectée.

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

Fermé le 1 novembre 2026, 13 h 38, par REF-103 temps 2b. Une personne connectée ne voit plus que les logos de son entreprise, et sa propre photo. Le trou d’isolation des fichiers est refermé. Le prochain trou du lot est REF-104, sur l’historique.

### 2. V3 Frontend et V13 Configuration — le tableau de bord n’a pas d’en-têtes

`vercel.json` ne fait que renvoyer toutes les adresses vers `index.html`. Pas de CSP, pas de HSTS, pas de `nosniff`, pas de `frame-ancestors`. Le site Next est mieux couvert, mais `script-src` est encore en observation seulement, et le commentaire de `web/next.config.ts` fixe l’échéance au **1er novembre 2026**.

### 3. V4 API — les fonctions ouvertes à tous les sites

`discours-analyze` et `remove-member-auth-cleanup` envoient `Access-Control-Allow-Origin: *`. Le jeton de session limite l’appel, mais n’importe quel site peut tenter la requête depuis un navigateur où la personne est connectée. L’origine devrait être limitée aux deux domaines de l’application.

### 4. V16 Journal et V6 anti-automatisation

REF-104 n’est pas fait : le rôle connecté a encore le droit SQL de modifier et d’effacer l’historique, même si la RLS le bloque. Le plafond d’envoi des liens magiques est côté navigateur, pas côté serveur. ASVS niveau 2 demande une limite serveur contre le bourrage d’identifiants.

### 5. V1 Encodage

Le `dangerouslySetInnerHTML` du thème et du JSON-LD est borné (script fixe, JSON échappé). Il ne faut pas étendre ce motif à un texte saisi par un utilisateur. Le tableau de bord n’a pas de politique de script qui l’interdirait.

### 6. V13 Secrets

Un fichier `recovery-codes vercel.txt` est présent dans le dossier de travail et ne doit jamais être commité. Les codes de secours Vercel sont des secrets de compte.

### 7. V14 Données et V15 Preuves

Pas de durée de conservation ni d’export/effacement des données personnelles dans le code. La CI lance les tests, pas une analyse de dépendances, et le lint racine est resté dehors à cause de quatre erreurs anciennes. ASVS niveau 2 attend une vérification répétable, pas seulement une relecture.

## Ce qui peut attendre

Le MD5 ne sert qu’à l’adresse Gravatar, pas à stocker un mot de passe. La cryptographie de session est celle de Supabase et de TLS.

## Suite utile

Le plus rentable est de finir **REF-103 temps 2b** et **REF-104**, puis d’ajouter les en-têtes du tableau de bord et de restreindre l’origine des deux fonctions. Le reste est du durcissement, pas le trou ouvert.
