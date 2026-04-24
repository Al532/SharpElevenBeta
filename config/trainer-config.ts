import pianoRhythmConfig from '../core/music/piano-rhythm-config.js';

export const ONE_TIME_MIGRATIONS = Object.freeze({
  silentDefaultPresetReset: '2026-04-silent-default-preset-reset',
  masterVolumeDefault50: '2026-04-master-volume-default-50'
});

export const PIANO_SAMPLE_RANGE = Object.freeze({
  low: 45,
  high: 89
});

export const PIANO_SETTINGS_CONFIG = Object.freeze({
  defaultFadeSettings: Object.freeze({
    timeConstantLow: 0.095,
    timeConstantHigh: 0.055,
    ...(pianoRhythmConfig?.pianoFadeOut || {})
  }),
  defaultMidiSettings: Object.freeze({
    enabled: false,
    inputId: '',
    sustainPedalEnabled: true
  }),
  presetVersion: 1
});

export const PATTERN_MODES = Object.freeze({
  both: 'both',
  major: 'major',
  minor: 'minor'
});

export const NEXT_PREVIEW_UNITS = Object.freeze({
  bars: 'bars',
  seconds: 'seconds'
});

export const DISPLAY_MODES = Object.freeze({
  showBoth: 'show-both',
  chordsOnly: 'chords-only',
  keyOnly: 'key-only'
});

export const HARMONY_DISPLAY_MODES = Object.freeze({
  default: 'default',
  rich: 'rich'
});

export const COMPING_STYLES = Object.freeze({
  off: 'off',
  strings: 'strings',
  piano: 'piano'
});

export const DRUM_MODES = Object.freeze({
  off: 'off',
  metronome24: 'metronome_2_4',
  hihats24: 'hihats_2_4',
  fullSwing: 'full_swing'
});

export const CHART_DISPLAY_CONFIG = Object.freeze({
  // Le layout controle la forme globale de la grille avant tout ajustement de taille du texte.
  layout: Object.freeze({
    // Nombre de mesures par ligne par defaut quand le chart ne definit pas deja ses propres systemes.
    barsPerRow: 4,
    // Si la grille a au plus ce nombre de lignes, elle peut s'etirer verticalement pour remplir l'espace.
    fillHeightMaxRowCount: 4,
    // Ecart vertical minimum autorise entre deux lignes du chart.
    rowGapMinPx: 12,
    // Ecart vertical maximum autorise entre deux lignes du chart dans le layout normal.
    rowGapMaxPx: 80,
    // Ecart special utilise quand il n'y a qu'une seule ligne et qu'elle est etiree.
    stretchSingleRowGapPx: 10,
    // Plafond de l'espacement des lignes etirees quand le chart est court et remplit la hauteur.
    stretchRowGapMaxPx: 24
  }),
  // La compensation d'echelle du texte normalise la taille percue selon le contexte de rendu des polices.
  textScaleCompensation: Object.freeze({
    // Variable CSS utilisee par la sonde de mesure qui estime la taille de rendu du texte.
    cssVarName: '--chart-text-scale-compensation',
    // Mot de test utilise pour mesurer la taille du texte a l'execution.
    probeText: 'Chart',
    // Taille de police de reference utilisee pour calculer le ratio de compensation.
    referenceFontSizePx: 100,
    // Valeur minimale de compensation autorisee, pour eviter de trop ecraser le texte.
    minCompensation: 0.4,
    // Valeur maximale de compensation autorisee, pour que la sonde ne grossisse jamais au-dela de la base.
    maxCompensation: 1
  }),
  // La compression decide quand il faut reduire tout le chart, une ligne, ou une mesure surchargee.
  compression: Object.freeze({
    // Seuil global d'occupation. Au-dela de ce ratio de remplissage, tout le chart commence a reduire.
    targetFillRatio: 1.2,
    // Seuil d'occupation par ligne applique apres le passage global pour les lignes qui restent trop denses.
    rowTargetFillRatio: 0.78,
    // Seuil local d'occupation utilise pour la reduction basee sur les collisions dans une meme mesure.
    collisionTargetFillRatio: 0.94,
    // Valeur plancher pour l'echelle globale afin que tout le chart ne descende jamais sous ce niveau.
    minGlobalScale: 0.42,
    // Valeur plancher pour la compression supplementaire au niveau d'une ligne apres le passage global.
    minRowScale: 0.36,
    // Valeur plancher pour le passage local de reduction des collisions.
    minCollisionScale: 0.34,
    // Adoucit le ratio de compression calcule pour que les changements d'echelle soient moins brusques.
    easingFactor: 0.98,
    // Penalite de densite supplementaire quand l'estimation de chevauchement dit qu'un groupe est tres serre.
    overlapPenaltyMultiplier: 1.45,
    // Premier seuil de densite a partir duquel un symbole d'accord est considere comme visuellement dense.
    denseChordThreshold: 12,
    // Deuxieme seuil de densite a partir duquel un symbole d'accord est considere comme tres dense.
    veryDenseChordThreshold: 15,
    // Seuil de densite a partir duquel le renderer passe a un comportement de compactage plus agressif.
    aggressiveDensityThreshold: 28,
    // Seuil de densite extreme pour le chemin de compactage le plus agressif.
    aggressiveExtremeDensityThreshold: 32
  }),
  // L'alignement affine le placement horizontal une fois que le renderer connait la geometrie reelle du DOM.
  alignment: Object.freeze({
    // Marge horizontale retiree de la largeur utile de la mesure pendant les calculs d'occupation.
    barBodyHorizontalInsetPx: 4,
    // Marge de securite conservee sur les deux bords de la mesure pour que les symboles ne touchent pas visuellement les limites.
    symbolBoundaryInsetPx: 1,
    // Ecart minimum preserve entre symboles voisins apres resolution des collisions.
    collisionMinGapPx: 1,
    // Marge supplementaire ajoutee quand la gestion des chevauchements a encore besoin d'un peu plus d'air.
    collisionOverlapPaddingPx: 2,
    // Point d'ancrage prefere vers la gauche pour un accord seul dans une mesure, exprime en fraction de la largeur.
    singleChordLeftBias: 0.2
  }),
  // Les metriques des tokens estiment le poids visuel avant que le renderer mesure les vraies largeurs dans le DOM.
  tokenMetrics: Object.freeze({
    // Poids ajoute pour un prefixe visible attache au symbole d'accord.
    displayPrefixWeight: 0.35,
    // Poids ajoute par alteration comme b ou #.
    accidentalWeight: 0.18,
    // Poids ajoute par slash, qui rend souvent les symboles plus larges et plus charges.
    slashWeight: 1.1,
    // Poids ajoute pour les parentheses, qui alourdissent visuellement le symbole.
    parentheticalWeight: 0.45,
    // Poids ajoute pour les extensions numeriques comme 9, 11, ou 13.
    extensionWeight: 0.25,
    // Poids ajoute pour les mots de qualite plus longs comme maj, sus, dim, alt, aug, add.
    longQualityWeight: 0.55
  }),
  // Mise a l'echelle supplementaire pour les mesures subdivisees ou plusieurs symboles longs partagent la meme case.
  subdividedTokenScale: Object.freeze({
    // Les symboles de cette longueur ou plus courts sont consideres comme courts et gardent leur taille normale.
    shortSymbolMaxLength: 3,
    // Seuil de poids visuel pour la reduction la plus forte.
    heavyWeightThreshold: 11,
    // Seuil de poids visuel pour la reduction moyenne.
    mediumWeightThreshold: 9.5,
    // Seuil de poids visuel pour la reduction legere.
    lightWeightThreshold: 7.5,
    // Echelle appliquee aux symboles subdivises les plus lourds.
    heavyScale: 0.82,
    // Echelle appliquee aux symboles subdivises de poids moyen-fort.
    mediumScale: 0.88,
    // Echelle appliquee aux symboles subdivises legerement lourds.
    lightScale: 0.94,
    // Echelle de repli douce pour les symboles longs qui ne franchissent pas les seuils plus lourds.
    defaultLongScale: 0.97
  })
});

export const TRAINER_DEFAULTS = Object.freeze({
  progressionsUrl: './default-progressions.txt',
  repetitionsPerKey: 2,
  nextPreviewLeadBars: 1,
  chordsPerBar: 1,
  supportedChordsPerBar: Object.freeze([1, 2, 4])
});

export const TRAINER_RESOURCE_PATHS = Object.freeze({
  patternHelp: 'progression-suffixes.txt'
});

export const WELCOME_CONFIG = Object.freeze({
  goals: Object.freeze({
    progression: 'progression',
    oneChord: 'one-chord',
    standard: 'standard'
  }),
  storageKeys: Object.freeze({
    onboardingCompleted: 'welcomeCompleted',
    showNextTime: 'welcomeShowNextTime',
    version: 'welcomeVersion'
  }),
  version: '2'
});

export const REVIEW_STANDARD_CONVERSIONS_URL = './parsing-projects/review-standard-conversions.txt';

export const WELCOME_PROGRESSIONS = Object.freeze({
  'ii-v-i-major': {
    summary: 'Suggested: II V I major, tempo 130, 2 reps per key.',
    presetName: 'II V I',
    majorMinor: false,
    repetitionsPerKey: 2,
    tempo: 130,
    chordsPerBar: 1,
    compingStyle: COMPING_STYLES.piano,
    drumsMode: 'full_swing',
    enabledKeys: new Array(12).fill(true)
  },
  'ii-v-i-minor': {
    summary: 'Suggested: II V I minor, tempo 130, 2 reps per key.',
    presetName: 'II V I',
    majorMinor: true,
    repetitionsPerKey: 2,
    tempo: 130,
    chordsPerBar: 1,
    compingStyle: COMPING_STYLES.piano,
    drumsMode: 'full_swing',
    enabledKeys: new Array(12).fill(true)
  },
  turnaround: {
    summary: 'Suggested: standard turnaround, tempo 130, 2 reps per key.',
    presetName: 'Standard turnaround',
    majorMinor: false,
    repetitionsPerKey: 2,
    tempo: 130,
    chordsPerBar: 1,
    compingStyle: COMPING_STYLES.piano,
    drumsMode: 'full_swing',
    enabledKeys: new Array(12).fill(true)
  }
});

export const WELCOME_ONE_CHORDS = Object.freeze({
  maj7: {
    summary: 'Suggested: random maj7, tempo 90, 1 rep per key.',
    patternName: 'Random maj7',
    pattern: 'one: maj7',
    patternMode: PATTERN_MODES.both,
    majorMinor: false,
    repetitionsPerKey: 1,
    tempo: 90,
    chordsPerBar: 1,
    compingStyle: COMPING_STYLES.strings,
    drumsMode: 'hihats_2_4',
    enabledKeys: new Array(12).fill(true)
  },
  m9: {
    summary: 'Suggested: random m9, tempo 90, 1 rep per key.',
    patternName: 'Random m9',
    pattern: 'one: m9',
    patternMode: PATTERN_MODES.both,
    majorMinor: false,
    repetitionsPerKey: 1,
    tempo: 90,
    chordsPerBar: 1,
    compingStyle: COMPING_STYLES.strings,
    drumsMode: 'hihats_2_4',
    enabledKeys: new Array(12).fill(true)
  },
  lyd: {
    summary: 'Suggested: random lydian, tempo 90, 1 rep per key.',
    patternName: 'Random lydian',
    pattern: 'one: lyd',
    patternMode: PATTERN_MODES.both,
    majorMinor: false,
    repetitionsPerKey: 1,
    tempo: 90,
    chordsPerBar: 1,
    compingStyle: COMPING_STYLES.strings,
    drumsMode: 'hihats_2_4',
    enabledKeys: new Array(12).fill(true)
  },
  '7alt': {
    summary: 'Suggested: random altered, tempo 90, 1 rep per key.',
    patternName: 'Random altered',
    pattern: 'one: 7alt',
    patternMode: PATTERN_MODES.both,
    majorMinor: false,
    repetitionsPerKey: 1,
    tempo: 90,
    chordsPerBar: 1,
    compingStyle: COMPING_STYLES.strings,
    drumsMode: 'hihats_2_4',
    enabledKeys: new Array(12).fill(true)
  },
  '13sus': {
    summary: 'Suggested: random 13sus4, tempo 90, 1 rep per key.',
    patternName: 'Random 13sus4',
    pattern: 'one: 13sus',
    patternMode: PATTERN_MODES.both,
    majorMinor: false,
    repetitionsPerKey: 1,
    tempo: 90,
    chordsPerBar: 1,
    compingStyle: COMPING_STYLES.strings,
    drumsMode: 'hihats_2_4',
    enabledKeys: new Array(12).fill(true)
  }
});

export const WELCOME_STANDARDS_FALLBACK = Object.freeze({
  'all-the-things-you-are': {
    summary: 'Suggested: All the Things You Are, single key, comfortable playback.',
    patternName: 'All the Things You Are',
    pattern: 'key: Ab | Fm7 | Bbm7 | Eb7 | Abmaj7 | Dbmaj7 | Dm7 G7 | Cmaj7 | Cmaj7 | Cm7 | Fm7 | Bb7 | Ebmaj7 | Abmaj7 | Am7 D7 | Gmaj7 | Gmaj7 | Am7 | D7 | Gmaj7 | Gmaj7 | F#m7b5 | B7b9 | Emaj7 | C7b9b13 | Fm7 | Bbm7 | Eb7 | Abmaj7 | Dbmaj7 | DbmMaj7 | Cm7 | Bdim7 | Bbm7 | Eb7 | Abmaj7 | Gm7b5 C7b9 |',
    patternMode: PATTERN_MODES.major,
    majorMinor: false,
    repetitionsPerKey: 1,
    tempo: 120,
    chordsPerBar: 4,
    compingStyle: COMPING_STYLES.piano,
    enabledKeys: [false, false, false, false, false, false, false, false, true, false, false, false]
  },
  'autumn-leaves': {
    summary: 'Suggested: Autumn Leaves, single key, comfortable playback.',
    patternName: 'Autumn Leaves',
    pattern: 'key: E | Am7 D7 | G | F#m7b5 B7 | Em | B7 | Em | Am7 D7 | G | F#m7b5 B7 | Em | F#m7b5 B7 | Em |',
    patternMode: PATTERN_MODES.minor,
    majorMinor: true,
    repetitionsPerKey: 1,
    tempo: 120,
    chordsPerBar: 4,
    compingStyle: COMPING_STYLES.piano,
    enabledKeys: [false, false, false, false, true, false, false, false, false, false, false, false]
  },
  'blue-bossa': {
    summary: 'Suggested: Blue Bossa, single key, relaxed playback.',
    patternName: 'Blue Bossa',
    pattern: 'key: C | Cm | Fm | Dm7b5 G7 | Cm | Ebm7 Ab7 | Db | Dm7b5 G7 | Cm G7 |',
    patternMode: PATTERN_MODES.minor,
    majorMinor: true,
    repetitionsPerKey: 1,
    tempo: 120,
    chordsPerBar: 4,
    compingStyle: COMPING_STYLES.piano,
    enabledKeys: [true, false, false, false, false, false, false, false, false, false, false, false]
  },
  solar: {
    summary: 'Suggested: Solar, single key, medium-up tempo.',
    patternName: 'Solar',
    pattern: 'key: C | Cm | Gm7 C7 | F | Fm7 Bb7 | Eb | Ebm7 Ab7 | Db | Dm7b5 G7 |',
    patternMode: PATTERN_MODES.minor,
    majorMinor: true,
    repetitionsPerKey: 1,
    tempo: 120,
    chordsPerBar: 4,
    compingStyle: COMPING_STYLES.piano,
    enabledKeys: [true, false, false, false, false, false, false, false, false, false, false, false]
  },
  'satin-doll': {
    summary: 'Suggested: Satin Doll, single key, comfortable groove.',
    patternName: 'Satin Doll',
    pattern: 'key: C [: | Dm7 G7 | Dm7 G7 | Em7 A7 | Em7 A7 | D7 | Db7 | [1 C | A7 :| [2 C | C | Gm7 | C7 | F | F | Am7 | D7 | G7 | A7 ] | Dm7 G7 | Dm7 G7 | Em7 A7 | Em7 A7 | D7 | Db7 | C | C |',
    patternMode: PATTERN_MODES.major,
    majorMinor: false,
    repetitionsPerKey: 1,
    tempo: 120,
    chordsPerBar: 4,
    compingStyle: COMPING_STYLES.piano,
    enabledKeys: [true, false, false, false, false, false, false, false, false, false, false, false]
  },
  'satin-doll-ireal': {
    summary: 'Suggested: Satin Doll (iReal), with repeats and explicit endings.',
    patternName: 'Satin Doll (iReal)',
    pattern: 'key: C [: | Dm7 G7 | Dm7 G7 | Em7 A7 | Em7 A7 | Am7 D7 | Abm7 Db7 | [1 Cmaj7 F7 | Em7 A7 :| [2 Cmaj7 | Cmaj7 ] [: | Gm7 C7 | Gm7 C7 | Fmaj7 | Fmaj7 | Am7 D7 | Am7 D7 | G7 | G7 :| | Dm7 G7 | Dm7 G7 | Em7 A7 | Em7 A7 | Am7 D7 | Abm7 Db7 | Cmaj7 F7 | Em7 A7 |',
    patternMode: PATTERN_MODES.major,
    majorMinor: false,
    repetitionsPerKey: 1,
    tempo: 120,
    chordsPerBar: 4,
    compingStyle: COMPING_STYLES.piano,
    enabledKeys: [true, false, false, false, false, false, false, false, false, false, false, false]
  },
  'there-will-never-be-another-you': {
    summary: 'Suggested: There Will Never Be Another You, single key, medium tempo.',
    patternName: 'There Will Never Be Another You',
    pattern: 'key: Eb | Eb | Dm7b5 G7 | Cm | Bbm7 Eb7 | Ab | Abm | Eb | Cm7 F7 | Fm7 Bb7 | Eb | Dm7b5 G7 | Cm | Bbm7 Eb7 | Ab | Abm | Eb C7 | Eb D7 | G7 C7 | Fm7 Bb7 | Eb |',
    patternMode: PATTERN_MODES.major,
    majorMinor: false,
    repetitionsPerKey: 1,
    tempo: 120,
    chordsPerBar: 4,
    compingStyle: COMPING_STYLES.piano,
    enabledKeys: [false, false, false, true, false, false, false, false, false, false, false, false]
  }
});

export const INSTRUMENT_RANGES = Object.freeze({
  bass: Object.freeze({ low: 28, high: 48 }),
  cello: Object.freeze({ low: 37, high: 80 }),
  violin: Object.freeze({ low: 56, high: 84 }),
  guideTone: Object.freeze({ low: 49, high: 60 })
});

export const AUDIO_SCHEDULING = Object.freeze({
  scheduleAheadSeconds: 0.1,
  scheduleIntervalMs: 25
});

export const AUDIO_TIMING = Object.freeze({
  noteFadeOutSeconds: 0.26,
  bassNoteAttackSeconds: 0.005,
  bassNoteOverlapSeconds: 0.11,
  bassNoteReleaseSeconds: 0.075,
  bassGainReleaseTimeConstant: 0.012,
  chordFadeBeforeSeconds: 0.1,
  chordFadeDurationSeconds: 0.2,
  stringLoopStartSeconds: 2.0,
  stringLoopEndSeconds: 9.0,
  stringLoopCrossfadeSeconds: 0.12,
  stringLegatoMaxDistanceSemitones: 2,
  stringLegatoGlideTimeSeconds: 0.05,
  stringLegatoPreDipTimeSeconds: 0.05,
  stringLegatoPreDipRatio: 0.7,
  stringLegatoHoldTimeSeconds: 0.1,
  stringLegatoFadeTimeSeconds: 0.2,
  automationCurveSteps: 32
});

export const AUDIO_LEVELS = Object.freeze({
  chordVolumeMultiplier: 1.35,
  bassGain: 0.8 * Math.pow(10, -2 / 20)
});

export const AUDIO_MIXER_CONFIG = Object.freeze({
  portamentoAlwaysOn: true,
  metronomeGainMultiplier: 2.4,
  drumsGainMultiplier: 1.18,
  defaultMasterVolumePercent: '50',
  mixerChannelCalibration: Object.freeze({
    master: 2,
    bass: 0.74,
    strings: 1,
    drums: 0.87
  }),
  safePreloadMeasures: 4
});

export const SAMPLE_LIBRARY_CONFIG = Object.freeze({
  drumHiHatSampleUrl: 'assets/13_heavy_hi-hat_chick.mp3',
  drumRideSampleUrls: Object.freeze([
    'assets/ride/20_bright_ride_body.mp3',
    'assets/ride/20_cool_ride_body.mp3',
    'assets/ride/20_crush_ride_body.mp3',
    'assets/ride/20_deep_full_ride_body.mp3',
    'assets/ride/20_dry_heavy_ride_body.mp3',
    'assets/ride/20_dry_ride_body.mp3',
    'assets/ride/20_power_ride_body.mp3',
    'assets/ride/21_dark_full_ride_body.mp3',
    'assets/ride/21_full_ride_body.mp3',
    'assets/ride/21_silver_mellow_ride_body.mp3',
    'assets/ride/22_dark_metal_ride_body.mp3',
    'assets/ride/22_dry_ride_body.mp3',
    'assets/ride/22_mellow_ride_body.mp3'
  ])
});

export const PIANO_COMPING_CONFIG = Object.freeze({
  chordAnticipationSeconds: 0.25,
  durationRatio: 0.4,
  minDurationSeconds: 0.12,
  maxDurationSeconds: 0.24,
  volumeMultiplier: 0.27
});

export const VOICING_RANDOMIZATION_CONFIG = Object.freeze({
  randomizationChance: 0.3,
  boundaryRandomizationChance: 0.3,
  topSlack: 1,
  boundarySlack: 2,
  centerSlack: 5,
  sumSlack: 10,
  innerSlack: 6
});

export const TRAINER_MODE_CONFIG = Object.freeze({
  patternModes: PATTERN_MODES,
  nextPreviewUnits: NEXT_PREVIEW_UNITS,
  displayModes: DISPLAY_MODES,
  harmonyDisplayModes: HARMONY_DISPLAY_MODES,
  compingStyles: COMPING_STYLES,
  drumModes: DRUM_MODES
});

export const TRAINER_APP_CONFIG = Object.freeze({
  defaults: TRAINER_DEFAULTS,
  resourcePaths: TRAINER_RESOURCE_PATHS,
  chartDisplay: CHART_DISPLAY_CONFIG,
  welcome: WELCOME_CONFIG,
  reviewStandardConversionsUrl: REVIEW_STANDARD_CONVERSIONS_URL
});

export const TRAINER_AUDIO_CONFIG = Object.freeze({
  oneTimeMigrations: ONE_TIME_MIGRATIONS,
  pianoSampleRange: PIANO_SAMPLE_RANGE,
  pianoSettings: PIANO_SETTINGS_CONFIG,
  instrumentRanges: INSTRUMENT_RANGES,
  audioScheduling: AUDIO_SCHEDULING,
  audioTiming: AUDIO_TIMING,
  audioLevels: AUDIO_LEVELS,
  audioMixer: AUDIO_MIXER_CONFIG,
  sampleLibrary: SAMPLE_LIBRARY_CONFIG,
  pianoComping: PIANO_COMPING_CONFIG,
  voicingRandomization: VOICING_RANDOMIZATION_CONFIG
});

export const TRAINER_PRESET_CONFIG = Object.freeze({
  welcomeProgressions: WELCOME_PROGRESSIONS,
  welcomeOneChords: WELCOME_ONE_CHORDS,
  welcomeStandardsFallback: WELCOME_STANDARDS_FALLBACK
});
