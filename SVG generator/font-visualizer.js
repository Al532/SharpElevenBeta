import { renderSvgChord as renderAtlasSvgChord } from './svg-chord-layout.js';

const SMUFL_CHORD_SYMBOL_FONT_ID = 'app-bravura-text-latin';

const SMUFL_CHORD_SYMBOLS = Object.freeze([
  { codepoint: 0xE870, name: 'csymDiminished', label: 'Diminished' },
  { codepoint: 0x1D1A9, name: 'degreeSlash', label: 'Diminished legacy' },
  { codepoint: 0xE871, name: 'csymHalfDiminished', label: 'Half-diminished' },
  { codepoint: 0xE872, name: 'csymAugmented', label: 'Augmented' },
  { codepoint: 0xE873, name: 'csymMajorSeventh', label: 'Major seventh' },
  { codepoint: 0xE874, name: 'csymMinor', label: 'Minor' },
  { codepoint: 0xE875, name: 'csymParensLeftTall', label: 'Left paren tall' },
  { codepoint: 0xE876, name: 'csymParensRightTall', label: 'Right paren tall' },
  { codepoint: 0xE877, name: 'csymBracketLeftTall', label: 'Left bracket tall' },
  { codepoint: 0xE878, name: 'csymBracketRightTall', label: 'Right bracket tall' },
  { codepoint: 0xE879, name: 'csymParensLeftVeryTall', label: 'Left paren very tall' },
  { codepoint: 0xE87A, name: 'csymParensRightVeryTall', label: 'Right paren very tall' },
  { codepoint: 0xE87B, name: 'csymAlteredBassSlash', label: 'Altered bass slash' },
  { codepoint: 0xE87C, name: 'csymDiagonalArrangementSlash', label: 'Diagonal arrangement slash' },
  { codepoint: 0xF4D7, name: 'csymHalfDiminishedSmall', label: 'Half-dim small' },
  { codepoint: 0xF4D8, name: 'csymDiminishedSmall', label: 'Dim small' },
  { codepoint: 0xF4D9, name: 'csymAugmentedSmall', label: 'Aug small' },
  { codepoint: 0xF4DA, name: 'csymMajorSeventhSmall', label: 'Major seventh small' },
  { codepoint: 0xF4DB, name: 'csymMinorSmall', label: 'Minor small' },
  { codepoint: 0xF4DC, name: 'csymAccidentalFlatSmall', label: 'Flat small' },
  { codepoint: 0xF4DD, name: 'csymAccidentalNaturalSmall', label: 'Natural small' },
  { codepoint: 0xF4DE, name: 'csymAccidentalSharpSmall', label: 'Sharp small' },
  { codepoint: 0xF4DF, name: 'csymAccidentalDoubleSharpSmall', label: 'Double sharp small' },
  { codepoint: 0xF4E0, name: 'csymAccidentalDoubleFlatSmall', label: 'Double flat small' },
  { codepoint: 0xF4E1, name: 'csymAccidentalTripleSharpSmall', label: 'Triple sharp small' },
  { codepoint: 0xF4E2, name: 'csymAccidentalTripleFlatSmall', label: 'Triple flat small' }
]);

const DEFAULT_MANIFEST = {
  version: 1,
  fonts: [
    { id: 'app-noto-latin', label: 'Sharp Eleven - Noto Sans Latin', path: 'fonts/SharpElevenApp/NotoSans-Latin.woff2', format: 'woff2', category: 'app', atlasScript: 'atlases/app-noto-latin.js' },
    { id: 'app-noto-symbols-math', label: 'Sharp Eleven - Noto Symbols Math', path: 'fonts/SharpElevenApp/NotoSansSymbols2-Math.woff2', format: 'woff2', category: 'app', atlasScript: 'atlases/app-noto-symbols-math.js' },
    { id: 'app-bravura-text-latin', label: 'Sharp Eleven - BravuraText Latin', path: 'fonts/SharpElevenApp/BravuraText-Latin-400.woff2', format: 'woff2', category: 'app', atlasScript: 'atlases/app-bravura-text-latin.js' },
    { id: 'noto-sans-semibold', label: 'Noto Sans SemiBold', path: 'fonts/Noto_Sans/static/NotoSans-SemiBold.ttf', format: 'truetype', category: 'candidate', atlasScript: 'atlases/noto-sans-semibold.js' },
    { id: 'noto-sans-condensed-semibold', label: 'Noto Sans Condensed SemiBold', path: 'fonts/Noto_Sans/static/NotoSans_Condensed-SemiBold.ttf', format: 'truetype', category: 'candidate', atlasScript: 'atlases/noto-sans-condensed-semibold.js' },
    { id: 'noto-sans-condensed-regular', label: 'Noto Sans Condensed Regular', path: 'fonts/Noto_Sans/static/NotoSans_Condensed-Regular.ttf', format: 'truetype', category: 'candidate', atlasScript: 'atlases/noto-sans-condensed-regular.js' },
    { id: 'ibm-plex-sans-regular', label: 'IBM Plex Sans Regular', path: 'fonts/IBM_Plex_Sans/static/IBMPlexSans-Regular.ttf', format: 'truetype', category: 'candidate', atlasScript: 'atlases/ibm-plex-sans-regular.js' },
    { id: 'ibm-plex-sans-condensed-semibold', label: 'IBM Plex Sans Condensed SemiBold', path: 'fonts/IBM_Plex_Sans/static/IBMPlexSans_Condensed-SemiBold.ttf', format: 'truetype', category: 'candidate', atlasScript: 'atlases/ibm-plex-sans-condensed-semibold.js' },
    { id: 'ibm-plex-sans-condensed-regular', label: 'IBM Plex Sans Condensed Regular', path: 'fonts/IBM_Plex_Sans/static/IBMPlexSans_Condensed-Regular.ttf', format: 'truetype', category: 'candidate', atlasScript: 'atlases/ibm-plex-sans-condensed-regular.js' }
  ],
  roleDefaults: {
    root: 'noto-sans-semibold',
    accidental: 'app-bravura-text-latin',
    quality: 'ibm-plex-sans-condensed-semibold',
    digit: 'app-noto-symbols-math',
    symbol: 'ibm-plex-sans-regular'
  }
};

const DEFAULT_SAMPLES = [
  'Cmaj7',
  'G7(b9b13)',
  'C7(b9#11b13)',
  'C7(b9)',
  'F♯7alt',
  'B♭m7',
  'Eø',
  'Cdim7',
  'G7sus',
  'G7sus4',
  'AΔ9',
  'D7(♭9♯11)',
  'C6/9',
  'Cm(maj7)',
  'CmM7',
  'F#m7b5',
  'Ab7(♭9♯9)',
  'C/G',
  'Bbmaj7/D',
  'C7alt',
  'G7sus(b9)',
  'Bø/A',
  'C°7/E♭',
  'Fmaj13(#11)',
  'E7sus4(b9)',
  'A7(b9#9#11b13)',
  'C13',
  'C7#9',
  'C7#11',
  'C7#5',
  'C13sus',
  'C13b9',
  'CmMaj7',
  'C9sus',
  'C7b9sus',
  'CdimMaj7'
].join('\n');

const ROLE_LABELS = {
  root: 'Lettres capitales',
  accidental: 'Altération',
  quality: 'Lettres minuscules',
  digit: 'Chiffres',
  symbol: 'Symboles'
};

const DEFAULT_TUNING = Object.freeze({
  canvasMinWidth: 80,
  canvasHeight: 96,
  paddingLeft: 6,
  paddingRight: 14,
  tracking: 0.03,
  digitTracking: -0.64,
  rootSize: 52,
  rootBaseline: 60,
  rootScaleX: 1.04,
  accidentalSize: 35,
  accidentalBaseline: 50,
  symbolSize: 38,
  symbolBaseline: 48,
  symbolDimSize: 40,
  symbolDimBaseline: 48,
  symbolHalfDimSize: 34,
  symbolHalfDimBaseline: 45,
  lowercaseSize: 32,
  lowercaseBaseline: 61,
  qualityGapBefore: -2,
  qualitySusScaleX: 0.82,
  qualityDimScaleX: 0.82,
  qualityMajScaleX: 0.82,
  supSize: 27,
  supBaseline: 34,
  supScaleX: 0.9,
  susUnderSize: 32,
  susUnderBaseline: 60,
  susUnderScaleX: 0.81,
  susUnderOffsetX: 4,
  susUnderGapAfter: 2,
  susUnderDigitSize: 21,
  susUnderDigitBaseline: 60,
  susUnderDigitGap: 3,
  altAfterSupSize: 24,
  altAfterSupBaseline: 34,
  altAfterSupScaleX: 0.82,
  altAfterSupGap: 0,
  mMajParenSize: 25,
  mMajParenBaseline: 38,
  mMajParenScaleX: 0.74,
  minorMajorTriangleOffsetX: 8,
  supAnchorDefault: -7,
  supAnchorSymbol: -11,
  supAnchorM: -12,
  supAnchorMaj: -12,
  supAnchorMMaj: -18,
  supAnchorDim: -8,
  supAnchorSus: -17,
  supYOffsetDefault: 0,
  supYOffsetSymbol: 0,
  supYOffsetM: 7,
  supYOffsetMaj: 0,
  supYOffsetMMaj: 0,
  supYOffsetDim: 3,
  supYOffsetSus: 7,
  figure69Size: 22,
  figure69TopBaseline: 30,
  figure69BottomBaseline: 46,
  figure69BottomOffsetX: 10,
  figure69SlashX1: 11,
  figure69SlashY1: 37,
  figure69SlashX2: 20,
  figure69SlashY2: 26,
  figure69SlashStroke: 1.8,
  figure69Advance: 26,
  bassSize: 30,
  bassBaseline: 82,
  slashGapBefore: -44,
  slashX1Offset: 10,
  slashY1: 71,
  slashX2Offset: 26,
  slashY2: 48,
  slashAdvance: 26,
  slashStroke: 2.4,
  stackPrefixSize: 27,
  stackPrefixBaseline: 34,
  stackPrefixScaleX: 0.9,
  stackPrefixGap: -7,
  stack1PrefixGap: -8,
  stack1Size: 27,
  stack1Baseline: 34,
  stack1ItemScaleX: 0.86,
  stackAccidentalDigitTracking: -0.32,
  stackSharpDigitTracking: -0.32,
  stackFlatDigitTracking: -0.32,
  stack1ParenSize: 20,
  stack1ParenBaseline: 31,
  stack1ParenScaleX: 0.6,
  stack1OpenParenGapBefore: 0,
  stack1OpenParenGapAfter: -2,
  stack1CloseParenGapBefore: -2,
  stack1CloseParenGapAfter: 0,
  stack1RowsOffsetX: 1.5,
  stack1GapAfter: -7,
  stackParenSize: 38,
  stackParenBaseline: 40,
  stackParenScaleX: 0.65,
  stack2ParenSize: 37,
  stack2ParenBaseline: 40,
  stack2ParenScaleX: 0.61,
  stack2OpenParenGapBefore: 0,
  stack2OpenParenGapAfter: 0,
  stack2CloseParenGapBefore: 0,
  stack2CloseParenGapAfter: 0,
  stack2RowsOffsetX: 1,
  stack2GapAfter: -3.5,
  stack3ParenSize: 43,
  stack3ParenBaseline: 40,
  stack3ParenScaleX: 0.68,
  stack3OpenParenGapBefore: 0,
  stack3OpenParenGapAfter: 0,
  stack3CloseParenGapBefore: 0,
  stack3CloseParenGapAfter: 0,
  stack3RowsOffsetX: 1,
  stack3GapAfter: -3.5,
  stackRowsOffsetX: 1,
  stackAlign: 0.5,
  stackItemScaleX: 0.92,
  stackGapAfter: -3.5,
  stack2CenterY: 36,
  stack2Gap: 18,
  stack2Size: 24,
  stack3CenterY: 34,
  stack3Gap: 14,
  stack3Size: 22,
  collisionBodySupMargin: 0,
  collisionStackMargin: 0,
  collisionBassMargin: 0,
  collisionBodySlashMargin: 0,
  collisionSlashBassMargin: 0,
  collisionTriangleInnerTrim: 0.42,
  collisionLineParts: 4,
  autoResolveSuperscript: 1,
  autoResolveBass: 1,
  autoResolveMaxShift: 80
});

const TUNING_GROUPS = [
  {
    label: 'Corps',
    controls: [
      ['rootSize', 'Cap taille', 38, 68, 1],
      ['rootBaseline', 'Cap base', 48, 78, 1],
      ['rootScaleX', 'Cap largeur', 0.75, 1.25, 0.01],
      ['lowercaseSize', 'Min taille', 22, 50, 1],
      ['lowercaseBaseline', 'Min base', 46, 76, 1],
      ['qualityGapBefore', 'Cap/min X', -14, 8, 0.5],
      ['qualitySusScaleX', 'sus largeur', 0.6, 1.1, 0.01],
      ['qualityDimScaleX', 'dim largeur', 0.6, 1.1, 0.01],
      ['qualityMajScaleX', 'maj largeur', 0.6, 1.1, 0.01],
      ['tracking', 'Tracking', -0.04, 0.1, 0.005],
      ['digitTracking', 'Chif écart', -0.95, 0.08, 0.005]
    ]
  },
  {
    label: 'Altérations',
    controls: [
      ['accidentalSize', 'Alt taille', 24, 56, 1],
      ['accidentalBaseline', 'Alt base', 34, 66, 1],
      ['symbolSize', 'Sym taille', 24, 54, 1],
      ['symbolBaseline', 'Sym base', 34, 66, 1],
      ['symbolDimSize', '° taille', 24, 54, 1],
      ['symbolDimBaseline', '° base', 34, 66, 1],
      ['symbolHalfDimSize', 'ø taille', 24, 54, 1],
      ['symbolHalfDimBaseline', 'ø base', 34, 66, 1]
    ]
  },
  {
    label: 'Exposants',
    controls: [
      ['supSize', 'Exp taille', 16, 38, 1],
      ['supBaseline', 'Exp base', 18, 52, 1],
      ['supScaleX', 'Exp largeur', 0.65, 1.1, 0.01],
      ['supAnchorDefault', 'X apres racine', -20, 12, 1],
      ['supAnchorSymbol', 'X apres symbole', -20, 12, 1],
      ['supAnchorDim', 'X apres dim', -30, 8, 1],
      ['supAnchorM', 'Après m', -30, 8, 1],
      ['supAnchorMaj', 'Après maj', -30, 8, 1],
      ['supAnchorMMaj', 'Après mMaj', -40, 8, 1],
      ['supAnchorSus', 'Après sus', -40, 8, 1]
    ]
  },
  {
    label: 'Exp Y',
    controls: [
      ['supYOffsetDefault', 'Y apres racine', -16, 16, 1],
      ['supYOffsetSymbol', 'Y apres symbole', -16, 16, 1],
      ['supYOffsetDim', 'Y apres dim', -16, 16, 1],
      ['supYOffsetM', 'Y apres m', -16, 16, 1],
      ['supYOffsetMaj', 'Y apres maj', -16, 16, 1],
      ['supYOffsetMMaj', 'Y apres mMaj', -16, 16, 1],
      ['supYOffsetSus', 'Y apres sus', -16, 16, 1]
    ]
  },
  {
    label: '7sus',
    controls: [
      ['susUnderSize', 'Sus taille', 14, 34, 1],
      ['susUnderBaseline', 'Sus base', 42, 72, 1],
      ['susUnderScaleX', 'Sus largeur', 0.65, 1.1, 0.01],
      ['susUnderOffsetX', 'Sus X', -16, 18, 1],
      ['susUnderGapAfter', 'Sus fin', -12, 16, 0.5],
      ['susUnderDigitSize', '4 taille', 14, 30, 1],
      ['susUnderDigitBaseline', '4 base', 42, 72, 1],
      ['susUnderDigitGap', 'sus/4 X', -8, 8, 0.5]
    ]
  },
  {
    label: '7alt',
    controls: [
      ['altAfterSupSize', 'Alt taille', 14, 34, 1],
      ['altAfterSupBaseline', 'Alt base', 30, 60, 1],
      ['altAfterSupScaleX', 'Alt largeur', 0.6, 1.1, 0.01],
      ['altAfterSupGap', '7/alt X', -8, 12, 0.5]
    ]
  },
  {
    label: 'm(maj7)',
    controls: [
      ['mMajParenSize', 'Par taille', 16, 34, 1],
      ['mMajParenBaseline', 'Par base', 24, 54, 1],
      ['mMajParenScaleX', 'Par largeur', 0.55, 1.05, 0.01],
      ['minorMajorTriangleOffsetX', 'Tri X', -8, 14, 1]
    ]
  },
  {
    label: '6/9',
    controls: [
      ['figure69Size', 'Taille', 14, 34, 1],
      ['figure69TopBaseline', '6 base', 18, 44, 1],
      ['figure69BottomBaseline', '9 base', 34, 62, 1],
      ['figure69BottomOffsetX', '9 X', 0, 26, 1],
      ['figure69SlashX1', 'Trait X1', 0, 24, 1],
      ['figure69SlashY1', 'Trait Y1', 34, 62, 1],
      ['figure69SlashX2', 'Trait X2', 4, 32, 1],
      ['figure69SlashY2', 'Trait Y2', 18, 44, 1],
      ['figure69SlashStroke', 'Trait ep.', 0.8, 4, 0.1],
      ['figure69Advance', 'Avance', 14, 46, 1]
    ]
  },
  {
    label: 'Parenthèses',
    controls: [
      ['stack1ParenSize', '1 par haut.', 16, 42, 1],
      ['stack1ParenBaseline', '1 par base', 24, 50, 1],
      ['stack1ParenScaleX', '1 par larg.', 0.4, 0.9, 0.01],
      ['stack1OpenParenGapBefore', '1 avant (', -8, 8, 0.5],
      ['stack1OpenParenGapAfter', '1 après (', -8, 8, 0.5],
      ['stack1CloseParenGapBefore', '1 avant )', -8, 8, 0.5],
      ['stack1CloseParenGapAfter', '1 après )', -8, 8, 0.5],
      ['stack1RowsOffsetX', '1 contenu X', -8, 6, 0.5],
      ['stack1GapAfter', '1 fin', -10, 6, 0.5],
      ['stack2ParenSize', '2 par taille', 24, 56, 1],
      ['stack2ParenBaseline', '2 par base', 24, 58, 1],
      ['stack2ParenScaleX', '2 par larg.', 0.4, 0.9, 0.01],
      ['stack2OpenParenGapBefore', '2 avant (', -8, 8, 0.5],
      ['stack2OpenParenGapAfter', '2 après (', -8, 8, 0.5],
      ['stack2CloseParenGapBefore', '2 avant )', -8, 8, 0.5],
      ['stack2CloseParenGapAfter', '2 après )', -8, 8, 0.5],
      ['stack2RowsOffsetX', '2 contenu X', -8, 8, 0.5],
      ['stack2GapAfter', '2 fin', -10, 8, 0.5],
      ['stack3ParenSize', '3 par taille', 28, 62, 1],
      ['stack3ParenBaseline', '3 par base', 24, 58, 1],
      ['stack3ParenScaleX', '3 par larg.', 0.4, 0.9, 0.01],
      ['stack3OpenParenGapBefore', '3 avant (', -8, 8, 0.5],
      ['stack3OpenParenGapAfter', '3 après (', -8, 8, 0.5],
      ['stack3CloseParenGapBefore', '3 avant )', -8, 8, 0.5],
      ['stack3CloseParenGapAfter', '3 après )', -8, 8, 0.5],
      ['stack3RowsOffsetX', '3 contenu X', -8, 8, 0.5],
      ['stack3GapAfter', '3 fin', -10, 8, 0.5],
      ['stack1PrefixGap', '7/par 1 X', -12, 12, 0.5],
      ['stackPrefixGap', '7/par X', -16, 12, 0.5],
      ['stackRowsOffsetX', 'Bloc X', -8, 8, 0.5],
      ['stackAlign', 'Align.', 0, 1, 0.5],
      ['stackGapAfter', 'Bloc fin', -4, 10, 0.5],
      ['stackItemScaleX', 'Item largeur', 0.65, 1.1, 0.01]
    ]
  },
  {
    label: 'Étages',
    controls: [
      ['stack1Size', '1 taille', 18, 34, 1],
      ['stack1Baseline', '1 base', 22, 48, 1],
      ['stack1ItemScaleX', '1 largeur', 0.65, 1.1, 0.01],
      ['stackAccidentalDigitTracking', 'Alt/chif', -0.6, 0.1, 0.01],
      ['stackSharpDigitTracking', '#/chif', -0.6, 0.1, 0.01],
      ['stackFlatDigitTracking', 'b/chif', -0.6, 0.1, 0.01],
      ['stack2CenterY', '2 centre', 22, 50, 1],
      ['stack2Gap', '2 écart', 10, 28, 1],
      ['stack2Size', '2 taille', 14, 30, 1],
      ['stack3CenterY', '3 centre', 22, 50, 1],
      ['stack3Gap', '3 écart', 9, 22, 1],
      ['stack3Size', '3 taille', 12, 26, 1]
    ]
  },
  {
    label: 'Basse',
    controls: [
      ['bassSize', 'Basse taille', 18, 42, 1],
      ['bassBaseline', 'Basse base', 64, 94, 1],
      ['slashGapBefore', 'Slash approche', -80, 14, 1],
      ['slashAdvance', 'Slash espace', -20, 44, 1],
      ['slashX1Offset', 'Slash X1', -4, 18, 1],
      ['slashX2Offset', 'Slash X2', 12, 38, 1],
      ['slashY1', 'Slash bas', 64, 94, 1],
      ['slashY2', 'Slash haut', 34, 64, 1],
      ['slashStroke', 'Slash trait', 0.8, 5, 0.1]
    ]
  },
  {
    label: 'Canvas',
    controls: [
      ['paddingLeft', 'Marge G', 0, 24, 1],
      ['paddingRight', 'Marge D', 0, 32, 1],
      ['canvasMinWidth', 'Min larg.', 40, 140, 1],
      ['canvasHeight', 'Hauteur', 70, 130, 1]
    ]
  },
  {
    label: 'Collisions',
    controls: [
      ['collisionBodySupMargin', 'Corps/exp', -6, 12, 0.5],
      ['collisionStackMargin', 'Stack', -6, 12, 0.5],
      ['collisionBassMargin', 'Exp/basse', -6, 12, 0.5],
      ['collisionBodySlashMargin', 'Corps/slash', -6, 12, 0.5],
      ['collisionSlashBassMargin', 'Slash/basse', -6, 12, 0.5],
      ['collisionTriangleInnerTrim', 'Triangle vide', 0, 0.7, 0.01],
      ['collisionLineParts', 'Slash parts', 1, 8, 1],
      ['autoResolveSuperscript', 'Auto exp', 0, 1, 1],
      ['autoResolveBass', 'Auto basse', 0, 1, 1],
      ['autoResolveMaxShift', 'Auto max', 0, 120, 1]
    ]
  }
];

const state = {
  manifest: DEFAULT_MANIFEST,
  roles: { ...DEFAULT_MANIFEST.roleDefaults },
  size: 36,
  weight: 400,
  debugBoxes: false,
  tuning: { ...DEFAULT_TUNING },
  loadedAtlasScripts: new Set(),
  failedAtlasScripts: new Set()
};

const els = {
  roleControls: document.querySelector('#roleControls'),
  previewGrid: document.querySelector('#previewGrid'),
  sampleInput: document.querySelector('#sampleInput'),
  statusText: document.querySelector('#statusText'),
  sizeControl: document.querySelector('#sizeControl'),
  sizeOutput: document.querySelector('#sizeOutput'),
  weightControl: document.querySelector('#weightControl'),
  weightOutput: document.querySelector('#weightOutput'),
  debugBoxesControl: document.querySelector('#debugBoxesControl'),
  smuflGrid: document.querySelector('#smuflGrid'),
  tuningControls: document.querySelector('#tuningControls'),
  defaultsOutput: document.querySelector('#defaultsOutput')
};

init();

async function init() {
  state.manifest = await loadManifest();
  state.roles = normalizeRoleMap({ ...DEFAULT_MANIFEST.roleDefaults, ...(state.manifest.roleDefaults || {}) });
  installFontFaces(state.manifest.fonts);
  renderRoleControls();
  renderTuningControls();
  bindControls();
  els.sampleInput.value = DEFAULT_SAMPLES;
  render();
}

function normalizeRoleMap(roles) {
  return Object.fromEntries(Object.keys(ROLE_LABELS).map((role) => [role, roles[role]]));
}

async function loadManifest() {
  try {
    const response = await fetch('./font-manifest.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch {
    return DEFAULT_MANIFEST;
  }
}

function installFontFaces(fonts) {
  const style = document.createElement('style');
  style.textContent = fonts.map((font) => `
    @font-face {
      font-family: "${fontFamily(font.id)}";
      src: url("./${font.path}") format("${font.format || guessFontFormat(font.path)}");
      font-display: swap;
      font-weight: 100 900;
    }
  `).join('\n');
  document.head.appendChild(style);
}

function renderRoleControls() {
  els.roleControls.innerHTML = Object.entries(ROLE_LABELS).map(([role, label]) => `
    <label class="role-field">
      <span>${label}</span>
      <select data-role="${role}">
        ${state.manifest.fonts.map((font) => `
          <option value="${escapeAttr(font.id)}"${state.roles[role] === font.id ? ' selected' : ''}>
            ${escapeHtml(font.label)}
          </option>
        `).join('')}
      </select>
    </label>
  `).join('');
}

function renderTuningControls() {
  els.tuningControls.innerHTML = TUNING_GROUPS.map((group, groupIndex) => `
    <details class="tuning-group"${groupIndex < 3 ? ' open' : ''}>
      <summary>${escapeHtml(group.label)}</summary>
      <div class="tuning-group-body">
        ${group.controls.map(([key, label, min, max, step]) => `
          <div class="tuning-row">
            <label for="tuning-${escapeAttr(key)}">${escapeHtml(label)}</label>
            <input id="tuning-${escapeAttr(key)}" type="range" min="${min}" max="${max}" step="${step}" value="${state.tuning[key]}" data-tuning="${escapeAttr(key)}">
            <output data-tuning-output="${escapeAttr(key)}">${formatTuningValue(state.tuning[key])}</output>
          </div>
        `).join('')}
      </div>
    </details>
  `).join('');
}

function bindControls() {
  els.roleControls.addEventListener('change', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    state.roles[target.dataset.role] = target.value;
    await render();
  });

  els.tuningControls.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const key = target.dataset.tuning;
    if (!key) return;
    state.tuning[key] = Number(target.value);
    updateTuningOutput(key);
    render();
  });

  els.defaultsOutput.addEventListener('focus', () => {
    els.defaultsOutput.select();
  });

  els.sampleInput.addEventListener('input', () => render());
  els.sizeControl.addEventListener('input', () => {
    state.size = Number(els.sizeControl.value);
    els.sizeOutput.value = String(state.size);
    render();
  });
  els.weightControl.addEventListener('input', () => {
    state.weight = Number(els.weightControl.value);
    els.weightOutput.value = String(state.weight);
    render();
  });
  els.debugBoxesControl.addEventListener('change', () => {
    state.debugBoxes = els.debugBoxesControl.checked;
    render();
  });
}

async function render() {
  document.documentElement.style.setProperty('--viz-size', `${state.size}px`);
  document.documentElement.style.setProperty('--viz-weight', `${state.weight}`);
  els.sizeOutput.value = String(state.size);
  els.weightOutput.value = String(state.weight);
  els.debugBoxesControl.checked = state.debugBoxes;
  updateDefaultsOutput();

  const chords = getSampleChords();
  await ensureRoleAtlases();

  els.previewGrid.innerHTML = chords.map((chord) => `
    <article class="chord-row" title="${escapeAttr(chord)}">
      <div class="source-chord">${escapeHtml(chord)}</div>
      <div class="render-zone">${renderSvgChord(chord)}</div>
    </article>
  `).join('');
  renderSmuflSymbols();

  updateStatus();
}

function updateTuningOutput(key) {
  const output = els.tuningControls.querySelector(`[data-tuning-output="${CSS.escape(key)}"]`);
  if (output) output.textContent = formatTuningValue(state.tuning[key]);
}

function updateDefaultsOutput() {
  els.defaultsOutput.value = JSON.stringify({
    roles: getSvgRoleFontIds(),
    size: state.size,
    weight: state.weight,
    tuning: state.tuning
  }, null, 2);
}

function getSampleChords() {
  return els.sampleInput.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^test\s*\d*\s*:?$/i.test(line));
}

async function ensureRoleAtlases() {
  const fontIds = new Set(Object.values(state.roles));
  fontIds.add(SMUFL_CHORD_SYMBOL_FONT_ID);
  await Promise.all([...fontIds].map((fontId) => ensureAtlas(fontId)));
}

async function ensureAtlas(fontId) {
  if (window.__sharpElevenSvgFontAtlases?.[fontId]) return;
  if (state.loadedAtlasScripts.has(fontId) || state.failedAtlasScripts.has(fontId)) return;

  const font = getFont(fontId);
  if (!font?.atlasScript) {
    state.failedAtlasScripts.add(fontId);
    return;
  }

  await new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `./${font.atlasScript}`;
    script.onload = () => {
      state.loadedAtlasScripts.add(fontId);
      resolve();
    };
    script.onerror = () => {
      state.failedAtlasScripts.add(fontId);
      resolve();
    };
    document.head.appendChild(script);
  });
}

function updateStatus() {
  const missingAtlasFonts = Object.values(state.roles)
    .filter((fontId, index, list) => list.indexOf(fontId) === index)
    .filter((fontId) => !window.__sharpElevenSvgFontAtlases?.[fontId]);

  els.statusText.textContent = missingAtlasFonts.length
    ? `Mode SVG atlas: atlas manquant pour ${missingAtlasFonts.map((id) => getFont(id)?.label || id).join(', ')}. Lance generate_atlas.py.`
    : 'Rendu SVG atlas composé depuis les chemins extraits.';
}

function renderSvgChord(chord) {
  return renderAtlasSvgChord(chord, {
    roleFontIds: getSvgRoleFontIds(),
    getAtlas: (fontId) => window.__sharpElevenSvgFontAtlases?.[fontId] || null,
    strokeWidth: getSvgStrokeWidth(),
    debug: {
      boxes: state.debugBoxes,
      advances: state.debugBoxes,
      parts: state.debugBoxes,
      global: state.debugBoxes
    },
    tuning: state.tuning
  });
}

function getSvgRoleFontIds() {
  return { ...state.roles, bass: state.roles.root };
}

function getSvgStrokeWidth() {
  return Math.max(0, Number(state.weight || 400) - 400) / 760;
}

function renderSmuflSymbols() {
  const atlas = window.__sharpElevenSvgFontAtlases?.[SMUFL_CHORD_SYMBOL_FONT_ID] || null;
  els.smuflGrid.innerHTML = SMUFL_CHORD_SYMBOLS.map((symbol) => {
    const char = String.fromCodePoint(symbol.codepoint);
    const code = `U+${symbol.codepoint.toString(16).toUpperCase().padStart(4, '0')}`;
    const glyph = atlas?.glyphs?.[char] || null;
    return `
      <article class="smufl-card${glyph ? '' : ' is-missing'}" title="${escapeAttr(`${symbol.name} ${code}`)}">
        <div class="smufl-glyph">${renderSmuflGlyph(glyph, char)}</div>
        <div class="smufl-meta">
          <strong>${escapeHtml(symbol.label)}</strong>
          <span>${escapeHtml(code)}</span>
          <span>${escapeHtml(symbol.name)}</span>
        </div>
      </article>
    `;
  }).join('');
}

function renderSmuflGlyph(glyph, char) {
  const width = 74;
  const height = 74;
  if (!glyph?.path) {
    return `<svg class="smufl-svg" viewBox="0 0 ${width} ${height}" aria-label="${escapeAttr(char)}"><text x="12" y="46" class="missing-glyph" font-size="28">${escapeHtml(char)}</text></svg>`;
  }

  const atlas = window.__sharpElevenSvgFontAtlases?.[SMUFL_CHORD_SYMBOL_FONT_ID];
  const scale = 38 / (atlas?.unitsPerEm || 1000);
  const advance = Math.max(1, Number(glyph.advance || 0));
  const x = Math.max(6, (width - (advance * scale)) / 2);
  const baseline = 52;
  return `
    <svg class="smufl-svg" viewBox="0 0 ${width} ${height}" aria-label="${escapeAttr(char)}">
      <path d="${escapeAttr(glyph.path)}" transform="translate(${round(x)} ${baseline}) scale(${round(scale)} ${round(-scale)})" fill="currentColor"/>
    </svg>
  `;
}

function fontFamily(fontId) {
  return `SEViz_${fontId.replace(/[^a-z0-9_-]/gi, '_')}`;
}

function getFont(fontId) {
  return state.manifest.fonts.find((font) => font.id === fontId) || null;
}

function guessFontFormat(path) {
  if (/\.woff2$/i.test(path)) return 'woff2';
  if (/\.woff$/i.test(path)) return 'woff';
  if (/\.otf$/i.test(path)) return 'opentype';
  return 'truetype';
}

function round(value) {
  return Math.round(Number(value) * 1000) / 1000;
}

function formatTuningValue(value) {
  const rounded = round(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('\n', ' ');
}
