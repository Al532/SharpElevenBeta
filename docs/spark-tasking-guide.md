## Spark Tasking Guide (Features extraction pattern)

Ce guide décrit une extraction mécanique et sûre des blocs applicatifs hors de `app.js`.

### Objectif

- Garder `app.js` comme orchestrateur.
- Déléguer les blocs de construction à des fichiers `features/drill/*`.
- Conserver strictement le contrat d’entrée/sortie déjà utilisé.

### Pattern cible

### `context -> bindings -> assembly` ou `root assembly/facade`

- Le contexte collecte les dépendances `app.js` (états, helpers, constantes, runtime flags).
- Les bindings normalisent/embrassent les entrées applicatives.
- L’assembly crée la dépendance métier finale via une import direct de l’implémentation.

### Ce qu’on peut extraire sans risque

- Constructeurs pur/ quasi-pur sans effet de bord immédiat.
- Composition de paramètres déjà passés localement dans `app.js`.
- Fonctions de création retournant un objet/factory existant.
- Sélection d’options et de constantes déjà présentes dans le scope local.

### Ce qu’il ne faut pas toucher

- Code audio/transport/playback (planification, start/stop, moteur audio).
- États globaux métier (gestion progression/session) hors façades de wiring.
- Refactor fonctionnel ou signature publique de l’API interne.
- Migration de types/fichiers `.ts` / `.js`.

### Checklist de validation rapide

- Vérifier que le bloc extrait garde le même objet de retour.
- Conserver l’orchestration d’appels dans `app.js`.
- Supprimer uniquement les imports rendus morts.
- Lancer les validations demandées avant de valider la tâche.
