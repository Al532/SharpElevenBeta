# Plan Remplace: Android d'abord, iPhone ensuite, a partir de la web app actuelle

## Resume

Objectif verrouille: livrer une application mobile sur la base web existante, sans replatforming, avec **Capacitor** comme emballage natif, **Android en premier**, puis **iOS** sur la meme architecture.

Constat de depart a prendre comme verite du depot:
- le chart est deja nominalement oriente vers le **direct same-page** et `window.__JPT_PLAYBACK_API__`
- une grande partie des seams playback et des contrats TS existent deja
- `app.js` reste encore trop gros et porte encore une partie du **moteur audio/runtime reel**
- le vrai blocage avant mobile n'est pas le packaging natif, mais la **mobile readiness de la web app**
- il n'existe encore ni projet `mobile/`, ni `android/`, ni `ios/`

Decision d'execution:
1. finir la stabilisation du backend playback direct partage
2. sortir le moteur runtime/audio restant de `app.js`
3. verrouiller les boundaries TypeScript critiques
4. franchir un gate explicite de mobile readiness web
5. creer et stabiliser l'app Android Capacitor
6. ouvrir iOS avec divergence minimale

## Changements D'Implementation

### 1. Verrouiller definitivement le playback direct comme backend nominal
- Conserver le chart en `mode: 'direct'` comme backend principal.
- Garder l'iframe uniquement comme **fallback technique transitoire**.
- Interdire toute nouvelle logique produit qui depend nominalement du bridge iframe.
- Valider que le chart consomme toujours le meme contrat direct, que la cible soit la fenetre courante ou le fallback iframe.
- Preserver strictement le flow `chart -> send selection to drill`.

Critere de sortie:
- le chart playback fonctionne en direct sur la meme page
- le fallback iframe existe encore mais n'est plus le chemin nominal
- aucune regression sur navigation, selection, start/stop/pause

### 2. Extraire le moteur playback/audio reel hors de `app.js`
- Reduire `app.js` a un role d'orchestration UI, wiring DOM, bootstrap et publication eventuelle de compat legacy.
- Deplacer le runtime reel restant vers un noyau partage sous `core/playback/*` et une boundary app-level claire cote drill.
- Sortir en priorite:
  - creation/reveil de l'`AudioContext`
  - orchestration transport/scheduler encore inline
  - etat runtime vivant encore heberge dans `app.js`
  - pont entre session, settings et execution audio
- Ne pas refaire de micro-extractions purement structurelles qui n'aident pas ce decouplage.

Decisions de design:
- le runtime partage devient la seule source de verite pour l'etat playback vivant
- le drill et le chart consomment le meme runtime via des adapters/hotes distincts
- `app.js` n'appelle plus directement la logique moteur sauf via une facade claire

Critere de sortie:
- le playback n'habite plus fonctionnellement dans `app.js`
- le chart direct et le drill reposent sur le meme runtime partage
- les handlers UI ne manipulent plus directement les details bas niveau audio

### 3. Finaliser les interfaces et la migration TypeScript utiles
- Garder `core/types/contracts.d.ts` comme surface contractuelle centrale tant que necessaire.
- Traiter comme contracts a verrouiller:
  - `PracticeSessionSpec`
  - `PlaybackSettings`
  - `PlaybackRuntimeState`
  - `PlaybackOperationResult`
  - `DirectPlaybackControllerOptions`
- Continuer la conversion TS uniquement sur les boundaries playback stables deja en place.
- Ne pas convertir massivement les wrappers UI encore mouvants.
- Refuser toute derive de scope "cleanup TS" sans impact direct sur playback partage ou mobile.

Changements d'API/types autorises:
- clarification de types et signatures existantes
- suppression d'ambiguites entre runtime direct, embedded et drill
- ajout de types manquants pour lifecycle/runtime si necessaire

Changements d'API/types interdits sans nouvelle decision:
- refonte du modele musical
- changement semantique de `PracticeSessionSpec`
- nouveau protocole distinct Android/iOS

Critere de sortie:
- `npm run typecheck` protege reellement les boundaries critiques
- les contracts partages sont assez stables pour supporter mobile sans dette cachee

### 4. Franchir le gate mobile readiness sur la web app
- Corriger d'abord la web app, pas Capacitor.
- Valider explicitement sur telephone ou emulateur:
  - audio unlock apres geste utilisateur
  - reprise correcte apres background/foreground
  - conservation/restauration d'etat
  - overlays, popovers, settings et transport utilisables au tactile
  - comportement correct avec viewport mobile, clavier virtuel, scroll et safe areas
- Harmoniser le drill principal avec le niveau de preparation responsive deja visible cote chart.
- Ajouter la gestion lifecycle necessaire au playback mobile:
  - pause/sync/reprise sure a la mise en arriere-plan
  - absence d'etat corrompu au retour foreground
  - gestion propre d'un `AudioContext` suspendu

Decisions UI/mobile:
- prioriser robustesse tactile et lisibilite sur petit ecran
- ne pas introduire de design system nouveau
- conserver le shell visuel existant, avec ajustements cibles mobile
- ne pas ajouter PWA/service worker/manifest sauf necessite clairement demontree

Critere de sortie:
- la web app est fiable sur mobile browser avant tout packaging natif
- aucun blocage majeur de lifecycle audio ou d'overlay tactile ne subsiste

### 5. Emballer et livrer Android avec Capacitor
- Creer un projet Capacitor dans `mobile/`.
- Y brancher le build web existant comme source unique de l'UI.
- Definir un app id Android stable, un nom d'app stable, les icones/splash, et les permissions minimales.
- N'ajouter que les integrations natives necessaires au premier jalon:
  - lifecycle app
  - comportement audio si le runtime web seul ne suffit pas
  - storage natif seulement si un besoin concret apparait
- Tester l'app installee sur appareil Android reel, pas seulement emulateur.

Critere de sortie Android:
- installation reussie sur appareil
- chart playback et Practice playback fonctionnent
- persistance des settings fonctionne
- aucun bug bloquant de navigation, overlay, audio unlock ou retour arriere
- package pret pour preparation Play Store

### 6. Ouvrir iOS sur la meme base
- Ajouter la plateforme iOS seulement apres stabilisation Android.
- Reutiliser exactement le meme runtime partage, les memes contrats et la meme logique metier.
- Corriger uniquement les ecarts propres a WKWebView/Safari iOS:
  - politiques audio
  - safe areas
  - viewport/gestuelle
  - reprise d'etat
- Refuser toute branche d'architecture specifique iOS sauf blocage avere.

Critere de sortie iOS:
- app installable et testable sur appareil
- playback chart et drill stable
- aucun besoin de runtime distinct entre Android et iOS

## Interfaces Et Contrats A Garder Stables

Surfaces a considerer comme publiques pour ce chantier:
- `PracticeSessionSpec`: format unique de session entre chart, drill et runtime
- `PlaybackSettings`: format unique de synchronisation des reglages playback
- `PlaybackRuntimeState`: source unique d'etat transport/runtime observable
- `PlaybackOperationResult`: resultat standardise des commandes runtime
- `DirectPlaybackControllerOptions`: boundary unique entre consommateurs UI et runtime direct

Regles:
- une seule semantique de session pour web, Android et iOS
- aucune duplication de contrat selon plateforme
- toute compat legacy iframe reste transitoire et secondaire

## Plan De Test Et Validation

Checks obligatoires a chaque etape structurante:
- `npm run typecheck`
- `npm run test:chart`
- `npm run test:drill-wrappers`
- `node --check app.js`
- `node --check chart-dev/main.js`

Scenarios obligatoires:
- chart playback nominal en direct
- fallback iframe encore fonctionnel tant qu'il existe
- `chart -> send selection to drill`
- sync des playback settings entre chart et drill
- start, pause, stop sans desynchronisation d'etat
- restauration correcte des volumes, tempo et options persistees
- audio demarre seulement apres interaction utilisateur sur mobile
- mise en arriere-plan puis retour foreground sans corruption d'etat
- overlays/settings/pickers utilisables au tactile
- Android installe sur appareil reel avec navigation et playback stables
- iOS teste sur appareil apres stabilisation Android

Criteres d'acceptation finaux:
- `app.js` n'est plus le moteur playback reel
- le runtime direct same-page est le backend nominal
- la web app passe le gate mobile readiness
- l'app Android Capacitor est prete pour finalisation Play Store
- l'ouverture iOS ne demande pas de refonte d'architecture

## Hypotheses Et Defaults Retenus

- base mobile retenue: **Capacitor**
- ordre de livraison: **Android puis iOS**
- aucun changement de framework web
- aucune evolution opportuniste non liee a playback partage, TS critique ou mobile readiness
- pas de PWA/offline comme sous-chantier dedie dans ce plan
- le warning Node sur `"type": "module"` reste hors scope tant qu'il ne bloque rien
- le fallback iframe reste autorise temporairement, mais jamais comme backend nominal
- les copies `public/` continuent d'etre des synchronisations des sources racine, pas des cibles d'edition manuelle
