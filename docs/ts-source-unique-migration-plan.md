# Plan de bascule définitive vers TS source unique

## Résumé

Migrer le code applicatif vers **TypeScript comme source unique**, sans double-maintien `.js`/`.ts`, en gardant **Vite comme transpileur** et `tsc` en **`noEmit`**. Le programme couvre tout le code produit de l’app, mais se déroule par vagues pour limiter le risque : `chart/chart-dev` d’abord, puis `core/playback`, puis `features/drill` et l’entrypoint principal.

L’état actuel impose ce découpage : `tsconfig.json` a encore `allowJs: true`, le runtime principal part de `app.js`, `chart-dev/index.html` pointe vers `main.js`, il existe environ **196 paires** `.js`/`.ts` dans `chart/core/features`, et les fichiers TS utilisent déjà largement des imports suffixés en `.js`. Le plan garde cette convention d’import pour éviter un churn inutile.

## Changements d’implémentation

### 1. Poser la cible technique une fois pour toutes

- Définir la convention officielle : **tout le code applicatif runtime vit en `.ts`** ; les anciens miroirs `.js` sont supprimés au fur et à mesure.
- Garder `moduleResolution: "Bundler"` et `noEmit: true` ; ne pas introduire de JS compilé committé dans le repo.
- Conserver les **spécificateurs d’import en `.js` dans les fichiers TS** quand ils fonctionnent déjà ; l’objectif est d’éliminer les sources JS, pas de réécrire tous les chemins d’import.
- Limiter la migration au **code produit de l’app** : entrypoints HTML + `chart/`, `core/`, `features/`, `config/`. Les scripts Node/Vite/configs `.js`/`.mjs` peuvent rester tels quels tant qu’ils ne participent pas au runtime applicatif.

### 2. Vague 1 : rendre `chart` et `chart-dev` TS-source-unique

- Faire de `chart-dev/main.ts` l’unique entrypoint chart et mettre `chart-dev/index.html` sur `./main.ts`.
- Supprimer les miroirs `.js` déjà couverts par la verticale `chart` après fusion de tout éventuel écart résiduel dans les `.ts`.
- Stabiliser les dépendances `chart -> core -> features/chart` de sorte que cette verticale ne dépende plus d’aucune source miroir `.js`.
- Utiliser cette vague pour figer la méthode de migration répétable : source canonique, vérif, suppression du miroir, puis passage au fichier suivant.

### 3. Vague 2 : convertir le runtime partagé `core` et la chaîne playback

- Migrer les modules `core/playback`, `core/storage`, `core/models` utilisés par les deux modes de l’app en conservant les API et les comportements.
- Traiter les groupes fortement couplés ensemble, pas fichier par fichier isolé, pour éviter des états intermédiaires bancals dans les providers/assemblies/adapters.
- À la fin de cette vague, tout le socle partagé consommé par `chart` et `drill` doit être TS-source-unique.

### 4. Vague 3 : convertir `features/drill`, `features/app` et l’entrypoint principal

- Introduire `app.ts` comme entrypoint applicatif principal et faire pointer `index.html` vers `./app.ts`.
- Migrer les modules `features/drill` et `features/app` restants jusqu’à supprimer la dépendance runtime à `app.js`.
- Garder le comportement de redirection existant dans `index.html` inchangé ; seul le module chargé change.
- Ne pas coupler cette vague à un durcissement de types global : la migration de langage et la montée en `strict` restent deux chantiers distincts.

### 5. Vague 4 : nettoyage final et verrouillage

- Une fois tout le runtime migré, enlever `allowJs: true` du `tsconfig.json`.
- Remplacer l’`include` en whitelist manuelle par des patterns couvrant clairement les sources TS applicatives, avec exclusions explicites si nécessaire.
- Supprimer les derniers miroirs `.js` applicatifs et toute logique de synchronisation implicite entre `.js` et `.ts`.
- Garder `strict: false` dans cette migration ; documenter que le prochain chantier, séparé, sera l’augmentation progressive de la rigueur TypeScript.

## Interfaces et surfaces publiques impactées

- `index.html` : passage de `./app.js` à `./app.ts`.
- `chart-dev/index.html` : passage de `./main.js` à `./main.ts`.
- `tsconfig.json` : retrait final de `allowJs`, simplification de `include`, conservation de `noEmit`.
- Convention de contribution : **les nouvelles sources applicatives sont créées uniquement en `.ts`** ; aucun nouveau miroir `.js` n’est accepté.

## Plan de test

- À chaque vague : `npm run typecheck`.
- Après la vague `chart` : `npm run test:chart`.
- Après la vague `drill/core` : `npm run test:drill-wrappers`.
- Vérification manuelle en dev :
  - `npm run dev:chart` pour la verticale chart.
  - `npm run dev:android:web` + live-reload Android pour les validations UI/mobile si nécessaire.
- Aucun build repo complet n’est requis dans ce plan tant qu’il n’est pas explicitement demandé.

## Hypothèses et choix par défaut

- La cible “définitive” signifie **TS source unique pour tout le runtime applicatif**, pas seulement la fin du double-maintien local.
- Les imports en `.js` dans les fichiers TS sont **conservés** si compatibles avec le resolver actuel ; on optimise la migration, pas l’esthétique des chemins.
- Les fichiers d’outillage (`vite*.js`, scripts `.mjs`, etc.) restent hors périmètre, sauf s’ils bloquent directement le runtime TS.
- Le chantier est exécuté **par verticales cohérentes**, pas en suppression massive de 196 paires en une seule passe.
