# Mobile Play Store Roadmap

Status: approved execution plan

Instruction to executor: if anything deviates from this plan, stop immediately and ask for help.

## Execution Update

Etat reel du repo au moment de cette mise a jour:

- le chart tourne deja en `direct` depuis `chart-dev/main.js`
- le chart ne depend plus nominalement de `window.__JPT_DRILL_API__`
- le host chart direct prefere deja un runtime same-page quand des `DirectPlaybackControllerOptions` sont publiees sur la fenetre courante
- le fallback iframe transitoire existe encore et reste autorise
- `app.js` et `chart-dev/main.js` ont deja ete fortement decomprimes en modules de seams/bindings/app-assembly
- la batterie suivante reste verte:
  - `npm run typecheck`
  - `npm run test:chart`
  - `node --check app.js`
  - `node --check chart-dev/main.js`

Decision d'execution a partir de maintenant:

- ne plus poursuivre les micro-extractions JS purement structurelles qui n'ameliorent pas directement:
  - le runtime playback partage,
  - la suppression du backend nominal iframe cote chart,
  - la migration TypeScript,
  - ou la preparation mobile Android/iOS
- considerer que la phase preparatoire de decomposition JS est deja suffisamment avancee pour sortir du mode "extractions opportunistes"
- prioriser desormais les etapes a plus forte valeur:
  1. certifier et verrouiller le direct same-page chart comme backend nominal reel, avec iframe seulement en fallback technique
  2. sortir le runtime audio/playback reel hors de `app.js`
  3. poursuivre la migration TypeScript uniquement sur les boundaries stables qui debloquent 1 ou 2
  4. ouvrir un gate explicite de mobile readiness avant Capacitor

Regle supplementaire:

- si une extraction envisagee ne reduit pas un couplage runtime/audio/playback reel, ne la pas faire
- si une modification touche seulement a l'orchestration UI, au confort de lecture, ou a des seams deja suffisantes, la remettre apres la migration TS

## Title

Plan Detaille Restant Vers Android Play Store, Puis iOS App Store

## Summary

Le plan a executer est desormais le suivant:

1. certifier le direct same-page comme backend nominal du chart, avec iframe seulement en fallback technique,
2. sortir en priorite le runtime audio/playback reel hors de `app.js`,
3. poursuivre la migration TypeScript uniquement sur les boundaries critiques et stables,
4. franchir un gate explicite de mobile readiness sur la web app existante,
5. encapsuler ensuite l'app web dans une app mobile Capacitor pour Android d'abord,
6. ouvrir enfin iOS sur la meme base Capacitor.

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
- Cette roadmap est la source de verite documentaire courante pour ce chantier.
- Ne pas supposer l'existence d'un document secondaire `docs/ts-refactor-handoff.md`; s'il devient necessaire plus tard, il devra etre recree explicitement.

## Phase 1. Certifier Le Runtime Playback Direct Same-Page

Objectif:
- verrouiller explicitement le direct same-page comme backend nominal du chart, sans casser le fallback iframe technique.

Travail a faire:
- Considerer comme acquis que le chart prefere deja un runtime same-page lorsque des `DirectPlaybackControllerOptions` sont publiees sur la fenetre courante.
- Limiter le travail restant a la validation et au bornage de la seam chart deja preparee:
  - `features/chart/chart-direct-playback-window-host.js`
  - `features/chart/chart-direct-playback-runtime-host.js`
  - `features/chart/chart-direct-playback-host.js`
  - `features/chart/chart-direct-playback-options.js`
- Ne pas rebrasser `chart-dev/main.js` au-dela de la validation des injections existantes.
- Preserver la consommation des memes `DirectPlaybackControllerOptions` entre host direct nominal et fallback technique.
- Garder l'iframe strictement comme secours tant que toute la validation n'a pas ete passee.

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
- faire de cette extraction la priorite absolue tant que `app.js` porte encore le moteur reel.

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
- rester strictement discipline sur les boundaries critiques qui debloquent le runtime partage et la couche mobile.

Ordre impose:
1. `core/types/contracts.d.ts` reste la verite contractuelle initiale
2. considerer comme deja convertis et stabilises en priorite:
   - `core/models/practice-session.ts`
   - `core/playback/playback-session-controller.ts`
   - `core/storage/app-state-storage.ts`
3. convertir ensuite uniquement les boundaries playback stables de `core/playback/*`
4. convertir ensuite, uniquement si les interfaces ont cesse de bouger:
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
- ne pas elargir la migration pour "faire propre" si cela ne reduit pas une ambiguite de contrat ou ne debloque pas le runtime partage/mobile

Resultat attendu:
- `npm run typecheck` devient un vrai garde-fou de boundaries critiques
- le runtime direct partage est type avant la couche mobile
- le cout de maintenance mobile baisse fortement

Condition d'escalade:
- si une conversion `.ts` impose une refonte de design non prevue,
- si une interface partagee devient ambigue,
- si `tsc` force des compromis non evidents sur les payloads runtime,
- demander de l'aide.

## Phase 4. Gate Mobile Readiness Avant Capacitor

Objectif:
- valider que la web app actuelle est suffisamment stable et mobile-ready avant d'ouvrir le chantier Capacitor comme flux principal.

Travail a faire:
- Valider explicitement sur device ou emulation mobile:
  - audio unlock apres geste utilisateur,
  - reprise correcte apres background/foreground,
  - viewport tactile et safe areas,
  - overlays/popovers/settings utilisables au tactile,
  - persistence `localStorage` et restauration d'etat,
  - playback chart direct sans dependance iframe nominale.
- Corriger en priorite les blocages qui relevent de la web app existante plutot que de Capacitor.
- Ne pas ouvrir de structure `mobile/` ni de packaging natif tant que ces points ne sont pas suffisamment fiables.

Critere de sortie:
- aucun blocage majeur d'audio unlock mobile
- aucun blocage majeur de reprise d'etat apres retour foreground
- chart et drill utilisables au tactile sans corruption d'etat
- la validation mobile ne depend pas du fallback iframe comme backend nominal

Condition d'escalade:
- si un probleme mobile critique ne peut pas etre corrige dans la web app existante,
- si un besoin natif devient clairement indispensable avant Capacitor,
- demander de l'aide.

## Phase 5. Android D'Abord Avec Capacitor

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

## Phase 6. iOS Ensuite

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
- readiness mobile web avant Capacitor:
  - audio start apres interaction utilisateur
  - reprise correcte apres background/foreground
  - overlays/popovers/settings utilisables au tactile
  - persistance `localStorage` intacte
- ouverture mobile Android:
  - lancement app
  - audio start apres interaction utilisateur
  - overlay/settings utilisables au tactile
  - retour arriere/navigation sans corruption d'etat

Criteres d'acceptation finaux:
- runtime direct same-page certifie comme backend nominal
- `app.js` reduit a un role principalement d'orchestration UI plutot que de moteur runtime
- boundaries TS critiques converties sans extension opportuniste de scope
- gate mobile readiness franchi sur la web app existante
- app Android Capacitor prete Play Store
- base iOS clairement ouverte sans refonte d'architecture

## Assumptions

- Base mobile retenue: Capacitor Web
- Android est la cible de sortie prioritaire; iOS vient immediatement apres sur la meme architecture
- Le warning Node sur `"type": "module"` reste hors scope
- Le fallback iframe reste autorise temporairement uniquement comme secours technique, pas comme backend nominal
- Le nom fonctionnel `drill` reste celui du mode produit, mais pas celui du playback generique partage
- Les conversions deja effectuees sur `core/models/practice-session.ts`, `core/playback/playback-session-controller.ts` et `core/storage/app-state-storage.ts` sont considerees acquises
- Si le modele low-level rencontre la moindre situation non prevue par ce plan, il doit s'arreter et demander de l'aide, sans prendre d'initiative d'architecture
