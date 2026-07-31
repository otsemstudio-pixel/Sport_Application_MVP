# ScoutApp — MVP scouting sportif gamifié

Application web responsive (mobile-first) qui structure le parcours d'un athlète amateur, du quartier jusqu'au repérage par un organisateur de tournoi. Deux profils : **athlète** et **organisateur**. Sport couvert pour ce MVP : basketball.

## Fonctionnalités

- Inscription / connexion (athlète ou organisateur), sessions par cookie
- Détection automatique des mineurs (< 18 ans) et flux de consentement parental obligatoire (code envoyé par SMS **simulé en console serveur** pour le MVP)
- Défis d'entraînement, enregistrement de séances, badges débloqués automatiquement (Régulier / Assidu / Habitué)
- Classement local des athlètes par ville et par sport (nombre de séances)
- Organisateurs : création d'événements, gestion des inscriptions (confirmé / en attente / refusé), saisie des résultats de tournoi
- Athlètes : liste des tournois filtrable par ville/sport, inscription (bloquée si mineur non consenti ou événement complet)

## Stack

- Next.js 16 (App Router) + TypeScript
- Routes API Next.js (REST interne) sous `app/api/`
- Prisma ORM 7, SQLite en local (`prisma/dev.db`)
- Auth maison : mot de passe hashé avec `bcryptjs`, session stockée en base et cookie `httpOnly`
- Tailwind CSS pour le style utilitaire mobile-first

## Lancer le projet en local

```bash
npm install
npx prisma migrate dev   # crée la base SQLite locale à partir du schéma
npx prisma db seed       # ajoute les défis et badges basketball de base
npm run dev
```

L'application est disponible sur http://localhost:3000.

Aucun compte n'est préchargé : crée un compte athlète et un compte organisateur depuis l'écran d'inscription pour tester le parcours complet.

### Tester le consentement parental

Le SMS n'est pas réellement envoyé : le code à 6 chiffres est affiché dans la console où tourne `npm run dev` (ligne `[SMS simulé] ...`). Crée un athlète avec une date de naissance de moins de 18 ans, va sur `/profil`, saisis un téléphone parent, puis récupère le code dans la console pour le valider.

## Passer à PostgreSQL

Le schéma Prisma (`prisma/schema.prisma`) utilise SQLite par défaut pour un démarrage immédiat sans configuration. Pour utiliser PostgreSQL :

1. Dans `prisma/schema.prisma`, change `provider = "sqlite"` en `provider = "postgresql"` dans le bloc `datasource db`.
2. Dans `.env`, remplace `DATABASE_URL` par l'URL de connexion PostgreSQL (`postgresql://user:password@host:5432/dbname`).
3. Relance `npx prisma migrate dev` pour recréer les migrations sur ce moteur.

## Structure du projet

```
app/
  api/            routes API (auth, consentement, défis, séances, badges, classement, événements, organisateur)
  inscription/    écran d'inscription
  connexion/      écran de connexion
  profil/         profil athlète + flux de consentement parental
  entrainement/   défis, séances, badges, classement local
  tournois/       liste filtrable des tournois + inscription
  organisateur/   tableau de bord organisateur (créer événement, gérer inscriptions, saisir résultats)
lib/
  prisma.ts       client Prisma (adaptateur SQLite)
  auth.ts         sessions, hash de mot de passe, calcul de la majorité
  badges.ts       évaluation des paliers de badges après chaque séance
prisma/
  schema.prisma   modèle de données
  seed.ts         défis et badges de base (basketball)
```

## Règles d'autorisation

- Un athlète mineur non consenti ne peut ni s'inscrire à un événement ni voir son profil actif.
- Seul l'organisateur créateur d'un événement peut voir ses inscrits, changer leur statut et saisir les résultats.
- Aucune route accessible à un athlète ne permet d'écrire dans la table `Resultat` : la saisie des résultats n'existe que sous `/api/organisateur/evenements/[id]/resultats`, réservée au rôle organisateur propriétaire de l'événement.
- Les séances d'entraînement (`/api/seances`) ne sont accessibles qu'à l'athlète propriétaire ; aucune route n'expose les séances à un organisateur.

## Hors périmètre (MVP)

Scouting par recruteurs externes, multi-sport, paiement en ligne, upload vidéo, application mobile native.
