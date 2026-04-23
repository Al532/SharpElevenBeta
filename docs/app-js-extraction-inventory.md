# Inventaire des blocs encore inline dans `app.js`

## safe mechanical candidates
- **Constantes musicales et tables de conversion** (p. ex. `KEY_NAMES_*`, `ROMAN_TO_SEMITONES`, `DEGREE_*`, `SEMITONE_TO_ROMAN_TOKEN`, `SCHEDULE_*`)
- **Groupe `dom`** (références DOM collectées en objet central).
- **Préférences d’onboarding statiques** (`WELCOME_PROGRESSIONS`, `WELCOME_ONE_CHORDS`) et `ONE_TIME_MIGRATIONS`.
- **Mise en place de l’identité de shell** (`initializeAppShell`, helpers de popup de welcome, gestion d’ouverture du picker de clés).
- **Affectations utilitaires de rendu simple** (ex: `syncBeatDots`, `setDisplayPlaceholderMessage`, `setDisplayPlaceholderVisible`) quand elles restent de simples transformateurs d’état UI.
- **Blocs d’initialisation de runtime partagé** déjà structurés par options (`createDrillSharedPlaybackRootAppAssembly` / `initializeApp`) tant qu’ils ne contiennent que du wiring.

## needs human review
- **Normalisation de patterns/progressions** (`normalizePatternMode`, `normalizePresetName`, `normalizeProgressionEntry`, `normalizeProgressionsMap`).
- **Gestion des options de volumé/douceur, mutes et niveaux MIDI/piano** (`normalizePianoFadeSettings`, `getPianoFadeProfile`, `applyMixerSettings`).
- **Pipeline de génération harmonique / voicings** (`computeChordVoicing`, `buildVoicingPlan*`, `getVoicing*`).
- **Aide d’affichage du pick/preview** (`renderWelcomeStandardOptions`, `buildKeyCheckboxes`, `syncKeyCheckboxStates`, `refreshDisplayedHarmony`).
- **Assemblage des options d’état et snapshot de settings** (`createDrillSettingsAppContextOptions`, `buildSettings` / `loadSettings` / `saveSettings`) en raison du couplage persistance+UI.

## do not touch with Spark
- **Scheduling/transport runtime** (`start`, `stop`, `togglePause`, `prepare*Schedule`, `SCHEDULE_INTERVAL`, `SCHEDULE_AHEAD`).
- **Exécution playback/audio directe** (`ensureMidiPianoRangePreload`, `playChord`, `ensureDrumSample`, `stopActiveChordVoices`, `preloadNearTermSamples`).
- **Gestion MIDI live** (`ensureMidiAccess`, `attachMidiInput`, `handleMidiMessage`) et callbacks de bas niveau.
- **Migration d’états persistés** (`applySilentDefaultPresetResetMigration`, `saveSettings`, `persistKeySelectionPreset`).
- **Envoi d’événements analytics métier** (`trackEvent`) couplé aux chemins de contrôle de session.
