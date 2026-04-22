# Mobile Play Store Roadmap

Status: approved execution plan

Instruction to executor: if anything deviates from this plan, stop immediately and ask for help.

## Title

Plan Detaille Restant Vers Android Play Store, Puis iOS App Store

## Summary

Le plan a executer est desormais le suivant:

1. finir la bascule technique vers un runtime playback direct partage,
2. convertir en priorite les contrats et boundaries en vrai TypeScript,
3. encapsuler l'app web existante dans une app mobile Capacitor pour Android d'abord,
4. valider Android comme cible nominale,
5. ouvrir ensuite iOS sur la meme base Capacitor.

Decision verrouillee pour la base mobile:
- Capacitor Web pour Android d'abord, puis iOS ensuite.

Regle imperative pour le modele low-level qui executera ce plan:
- A la moindre variation par rapport a ce qui est prevu ici, au moindre doute sur une interface, un flux, un nom de fichier, un test qui echoue d'une facon non prevue, ou un comportement runtime qui ne correspond pas au plan, il doit s'arreter immediatement et demander de l'aide.
- Il ne doit jamais improviser une nouvelle architecture, un nouveau framework mobile, un nouveau contrat de donnees, ou une nouvelle strategie de migration sans escalade explicite.

## Consignes D'Execution

- Ne plus investir dans des micro-extractions JS sans lien direct avec:
  - le runtime playback partage,
  - la suppression du host iframe chart,
  - la migration TS,
  - la preparation Android/iOS.
- Preserver strictement les comportements deja stables:
  - `chart -> selection -> send to drill`
  - settings playback partages
  - rendu/navigation chart
  - onboarding drill
  - normalisations musicales actuelles
- Ne pas modifier les tables de conversion harmonique ni les alias d'accords, sauf besoin explicitement identifie.
- Ne pas changer le framework build web actuel.
- Ne pas toucher a `public/` manuellement; continuer a considerer la racine du repo comme source of truth.
- Tant que le runtime direct same-page n'est pas valide, garder le fallback iframe transitoire disponible.
- A toute divergence entre `docs/ts-refactor-handoff.md` et le code reel, demander de l'aide avant de continuer.

## Phase 1. Terminer Le Runtime Playback Direct Partage

Objectif:
- supprimer la dependance nominale du chart au host iframe, sans encore casser le fallback.

Travail a faire:
- Creer une implementation same-page reelle du host direct playback cote chart, au lieu du host iframe transitoire.
- Le point de remplacement doit etre uniquement la couture chart deja preparee:
  - `features/chart/chart-direct-playback-window-host.js`
  - `features/chart/chart-direct-playback-runtime-host.js`
  - `features/chart/chart-direct-playback-host.js`
  - `features/chart/chart-direct-playback-options.js`
- Ne pas rebrasser `chart-dev/main.js` au-dela de l'injection du nouveau host.
- Le host same-page doit consommer les memes `DirectPlaybackControllerOptions` que le host transitoire.
- Le fallback iframe doit rester en secours tant que le same-page host n'a pas passe toute la validation.

Interfaces a verrouiller:
- `DirectPlaybackControllerOptions`
- `PlaybackRuntimeState`
- `PlaybackOperationResult`
- `ChartDirectPlaybackRuntimeHost`

Resultat attendu:
- le playback chart fonctionne via `mode: 'direct'` sans dependre nominalement a `window.__JPT_DRILL_API__`
- le host iframe devient fallback technique, pas backend principal
- aucune regression sur `navigateToDrillWithSelection`

Condition d'escalade:
- si le same-page host ne peut pas reutiliser proprement les options directes publiees cote app,
- ou s'il faut changer la semantique de `PracticeSessionSpec`,
- ou s'il faut dupliquer massivement du runtime depuis `app.js`,
- demander de l'aide.

## Phase 2. Sortir Le Runtime Audio/Playback Reel Hors De `app.js`

Objectif:
- faire du runtime playback un vrai module partage instanciable par le chart et le drill.

Travail a faire:
- Continuer l'extraction uniquement sur les blocs encore reellement "moteur" dans `app.js`:
  - transport runtime restant,
  - scheduling playback restant,
  - orchestration audio bas niveau encore couplee au host drill,
  - etat runtime vivant encore non encapsule.
- La cible est un noyau reutilisable sous `core/playback/*` plus une boundary audio app-level claire cote `features/drill/*`.
- Le runtime shared doit etre instanciable:
  - depuis la page principale,
  - depuis le chart,
  - sans host iframe impose.
- Le code qui reste dans `app.js` doit tendre vers:
  - bootstrapping UI,
  - wiring DOM,
  - integration ecran,
  - publication eventuelle de compat legacy.

Frontieres a stabiliser:
- runtime playback partage
- wrapper audio engine
- session adapter direct
- assembly/provider runtime
- publication legacy optionnelle, non centrale

Resultat attendu:
- `app.js` n'est plus le lieu ou vit le moteur playback
- le chart direct same-page consomme le runtime partage
- le drill consomme le meme runtime shared via son adaptation UI

Condition d'escalade:
- si une extraction demande de redefinir le modele musical,
- si le scheduler historique se revele incompatible avec une boundary stable,
- si l'extraction oblige a casser les flows `drill` actuels,
- demander de l'aide.

## Phase 3. Migration TypeScript Reelle

Objectif:
- arreter la phase "TS preparatoire" et convertir les vraies boundaries stables en `.ts`.

Ordre impose:
1. `core/types/contracts.d.ts` reste la verite contractuelle initiale
2. convertir en priorite:
   - `core/models/practice-session.js`
   - `core/playback/playback-session-controller.js`
   - `core/storage/app-state-storage.js`
3. convertir ensuite les boundaries playback stables de `core/playback/*`
4. convertir ensuite:
   - `features/chart/chart-session-builder.js`
   - `features/drill/drill-session-builder.js`
   - `features/chart/chart-playback-controller.js`
   - `features/drill/drill-playback-controller.js`
5. seulement apres:
   - les helpers/features secondaires
   - les wrappers UI

Regles:
- ne pas convertir massivement des fichiers encore mouvants
- chaque conversion doit remplacer des JSDoc existants par de vrais types, pas changer l'architecture
- conserver les noms et shapes des contrats publics deja stabilises
- eviter tout `any` nouveau sauf frontiere explicitement legacy

Resultat attendu:
- `npm run typecheck` devient un vrai garde-fou de boundaries critiques
- le runtime direct partage est type avant la couche mobile
- le cout de maintenance mobile baisse fortement

Condition d'escalade:
- si une conversion `.ts` impose une refonte de design non prevue,
- si une interface partagee devient ambigue,
- si `tsc` force des compromis non evidents sur les payloads runtime,
- demander de l'aide.

## Phase 4. Android D'Abord Avec Capacitor

Objectif:
- livrer une app Android Play Store sur la base web stabilisee, sans replatforming React Native.

Decisions verrouillees:
- framework mobile: Capacitor
- strategie Android: Web app embarquee + plugins natifs minimaux
- priorite: publication Android fiable avant iOS

Travail a faire:
- Creer un projet Capacitor dans le repo ou en sous-dossier `mobile/` avec:
  - app id Android stable
  - nom d'app stable
  - config d'assets/icones/splash
- Brancher le build web existant comme source de l'app mobile.
- Ajouter uniquement les integrations natives necessaires au premier jalon Android:
  - lifecycle app
  - storage sur si besoin
  - audio/background behavior si necessaire
  - deep link eventuel seulement si deja utile
- Verifier la compatibilite tactile/mobile sur les ecrans existants:
  - shell principal
  - chart
  - drill
  - overlays/popovers/settings
- Corriger les comportements bloquants mobile:
  - audio unlock
  - resize viewport
  - orientation
  - clavier virtuel
  - safe areas
  - scroll/overflow
- Preparer signature, package Android, assets store, permissions minimales.

Critere de fin Android:
- app installable sur appareil Android
- chart playback fonctionne sans iframe nominal
- drill playback fonctionne
- persistance settings fonctionne
- aucun blocage UX majeur sur tactile
- build Play Store prepare

Condition d'escalade:
- si Capacitor revele un blocage structurel audio que le web runtime ne peut pas absorber,
- si Android impose un plugin natif non trivial,
- si le playback demande un comportement foreground/background non prevu,
- demander de l'aide.

## Phase 5. iOS Ensuite

Objectif:
- ouvrir l'App Store avec le minimum de divergence par rapport a la version Android.

Travail a faire:
- Ajouter la plateforme iOS au projet Capacitor apres stabilisation Android.
- Corriger uniquement les ecarts specifiques iOS:
  - politiques audio/autoplay
  - safe areas
  - comportements Safari/WKWebView
  - gestuelle et viewport
- Reutiliser le meme runtime direct partage, les memes contrats TS, la meme logique metier.
- Ne pas creer de branche fonctionnelle specifique iOS sauf necessite stricte.

Critere de fin iOS:
- app installable/testable sur appareil iOS
- playback chart et drill stables
- settings/persistence stables
- aucun besoin de runtime distinct Android/iOS

Condition d'escalade:
- si iOS demande un comportement audio incompatible avec Android sur la meme boundary,
- si un plugin natif specifique devient indispensable,
- demander de l'aide.

## Test Plan

A exiger a chaque etape structurante:
- `npm run typecheck`
- `npm run test:chart`
- `node --check app.js`
- `node --check chart-dev/main.js`

Scenarios obligatoires:
- chart playback nominal en `direct`
- chart playback sans dependance nominale au bridge iframe
- fallback iframe encore fonctionnel tant qu'il n'est pas supprime
- sync des playback settings entre chart et drill
- `chart -> send selection to drill`
- pause/start/stop corrects
- persistance des volumes mixer avec bons defaults
- ouverture mobile Android:
  - lancement app
  - audio start apres interaction utilisateur
  - overlay/settings utilisables au tactile
  - retour arriere/navigation sans corruption d'etat

Criteres d'acceptation finaux:
- runtime direct same-page operationnel
- `app.js` reduit a un role principalement d'orchestration UI
- boundaries TS critiques converties
- app Android Capacitor prete Play Store
- base iOS clairement ouverte sans refonte d'architecture

## Assumptions

- Base mobile retenue: Capacitor Web
- Android est la cible de sortie prioritaire; iOS vient immediatement apres sur la meme architecture
- Le warning Node sur `"type": "module"` reste hors scope
- Le fallback iframe reste autorise temporairement tant que le host same-page direct n'est pas valide
- Le nom fonctionnel `drill` reste celui du mode produit, mais pas celui du playback generique partage
- Si le modele low-level rencontre la moindre situation non prevue par ce plan, il doit s'arreter et demander de l'aide, sans prendre d'initiative d'architecture
