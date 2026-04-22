import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHART_DOCUMENT_CONTRACT,
  CHART_PLAYBACK_PLAN_CONTRACT,
  PRACTICE_SESSION_CONTRACT,
  createChartDocument,
  createChartDocumentsFromIRealSource,
  createChartPlaybackPlanFromDocument,
  createChartViewModel,
  createDrillExportFromPlaybackPlan,
  createPracticeSessionFromChartDocument,
  createPracticeSessionFromChartDocumentWithPlaybackPlan,
  createPracticeSessionFromChartSelection,
  createPracticeSessionFromSelectedChartDocument,
  createSelectedChartDocument
} from '../chart/node-index.mjs';
import { createWalkingBassGenerator } from '../walking-bass.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(projectRoot, 'parsing-projects', 'ireal', 'sources', 'jazz-1460.txt');

const importedDocuments = await createChartDocumentsFromIRealSource({ sourcePath });
assert.ok(importedDocuments.length > 1000, 'Raw iReal jazz source imports the full library.');
assert.ok(importedDocuments.some(document => document.source.type === 'ireal-source'), 'Raw iReal imports are tagged as source-driven.');
const byTitle = new Map(importedDocuments.map(document => [document.metadata.title, document]));

const satinDoll = byTitle.get('Satin Doll');
assert.ok(satinDoll, 'Satin Doll is present in the raw source import.');
assert.equal(satinDoll.metadata.canonicalGroove, 'Jazz-Medium Swing', 'Satin Doll resolves to the default canonical groove.');
assert.equal(satinDoll.metadata.grooveSource, 'default', 'Satin Doll uses the default groove when style and groove need no special mapping.');
assert.ok(satinDoll.bars.some(bar => bar.endings.includes(1)), 'Satin Doll keeps first ending.');
assert.ok(satinDoll.bars.some(bar => bar.endings.includes(2)), 'Satin Doll keeps second ending.');
assert.ok(satinDoll.bars.some(bar => bar.notation.kind === 'single_bar_repeat'), 'Satin Doll keeps repeat display bars.');

const alice = byTitle.get('Alice In Wonderland');
assert.ok(alice, 'Alice In Wonderland is present in the raw source import.');
assert.ok(alice.bars.some(bar => bar.directives.some(directive => directive.type === 'dc_al_ending')), 'Alice keeps D.C. al ending.');
assert.ok(alice.bars.some(bar => bar.flags.includes('fine')), 'Alice keeps Fine.');
assert.equal(alice.metadata.sourceTranspose, 0, 'Alice keeps the source transpose metadata from iReal.');
assert.equal(alice.metadata.sourceRepeats, 3, 'Alice keeps the source repeats metadata from iReal.');

const bodyAndSoul = byTitle.get('Body And Soul');
assert.ok(bodyAndSoul, 'Body And Soul is present in the raw source import.');
assert.ok(bodyAndSoul.bars.some(bar => bar.playback.slots.some(slot => slot.bass)), 'Body And Soul keeps slash chords.');

const aBallad = byTitle.get('A Ballad');
assert.ok(aBallad, 'A Ballad is present in the raw source import.');
assert.ok(
  aBallad.bars.some(bar => bar.playback.slots.some(slot => slot.quality === '7b9b13')),
  'A Ballad normalizes 7b13-style source chords to the canonical 7b9b13 quality.'
);
assert.ok(
  !aBallad.bars.some(bar => bar.playback.slots.some(slot => slot.quality === '7b13')),
  'A Ballad no longer leaves 7b13 as a raw imported playback quality.'
);
const aBalladPlan = createChartPlaybackPlanFromDocument(aBallad);
const aBalladExport = createDrillExportFromPlaybackPlan(aBalladPlan, aBallad);
assert.equal(
  aBalladExport.engineBars[45],
  'A7alt A7alt Ab7alt Ab7alt',
  'A Ballad bar 46 collapses 8 iReal cells into 4 Drill beat slots.'
);
assert.equal(
  aBalladExport.engineBars[46],
  'G7 G7 Cmaj7 Cmaj7',
  'A Ballad bar 47 collapses 8 iReal cells into 4 Drill beat slots.'
);

const allTheThings = byTitle.get('All The Things You Are');
assert.ok(allTheThings, 'All The Things You Are is present in the raw source import.');
assert.equal(allTheThings.sections.length >= 3, true, 'All The Things You Are keeps multiple sections.');

const stella = byTitle.get('Stella By Starlight');
assert.ok(stella, 'Stella is present in the raw source import.');
assert.ok(stella.bars.some(bar => bar.playback.slots.some(slot => slot.alternate)), 'Stella keeps alternate harmony markers.');

const satinPlan = createChartPlaybackPlanFromDocument(satinDoll);
assert.ok(satinPlan.entries.length > satinDoll.bars.length, 'Satin Doll playback expands the repeat.');
assert.equal(satinPlan.schemaVersion, CHART_PLAYBACK_PLAN_CONTRACT.schemaVersion, 'Playback plans expose the stable schema version.');

const alicePlan = createChartPlaybackPlanFromDocument(alice);
assert.ok(alicePlan.entries.some(entry => entry.flags.includes('fine')), 'Alice playback reaches Fine.');

const viewModel = createChartViewModel(bodyAndSoul, { displayTransposeSemitones: 2 });
assert.equal(bodyAndSoul.metadata.sourceKey, 'Db', 'Source document key stays unchanged.');
assert.notEqual(viewModel.metadata.displayKey, bodyAndSoul.metadata.sourceKey, 'Display key transposes in view model.');
const stellaViewModel = createChartViewModel(stella, { displayTransposeSemitones: 2 });
const stellaAlternateSlot = stellaViewModel.bars.flatMap(bar => bar.displayTokens).find(token => token?.alternate);
assert.ok(stellaAlternateSlot, 'Stella exposes alternate harmony in the transposed view model.');
assert.notEqual(stellaAlternateSlot.alternate.symbol, stella.bars.flatMap(bar => bar.playback.slots).find(slot => slot?.alternate)?.alternate?.symbol, 'Alternate harmony transposes with the primary display token.');

const popDocuments = await createChartDocumentsFromIRealSource({
  sourcePath: path.join(projectRoot, 'parsing-projects', 'ireal', 'sources', 'pop-400.txt')
});
const americanBoy = popDocuments.find(document => document.metadata.title === 'American Boy');
assert.ok(americanBoy, 'American Boy is present in the pop source import.');
assert.equal(americanBoy.metadata.grooveReference, 'Pop-Disco', 'Pop source keeps the explicit groove reference.');
assert.equal(americanBoy.metadata.canonicalGroove, 'Pop-Disco', 'Explicit groove reference wins over style inference.');
assert.equal(americanBoy.metadata.defaultTempo, 120, 'Explicit Pop-Disco groove resolves to the documented default tempo.');

const billieJean = popDocuments.find(document => document.metadata.title === 'Billie Jean');
assert.ok(billieJean, 'Billie Jean is present in the pop source import.');
assert.equal(billieJean.metadata.canonicalGroove, 'Pop-Rock', 'Pop style falls back to the canonical Pop-Rock groove.');
assert.equal(billieJean.metadata.defaultTempo, 115, 'Pop style fallback resolves to the documented Pop-Rock tempo.');

const girl = popDocuments.find(document => document.metadata.title === 'Girl');
assert.ok(girl, 'Girl is present in the pop source import.');
assert.equal(girl.metadata.grooveReference, 'Jazz-Gypsy Jazz', 'Girl keeps the explicit iReal groove reference.');
assert.equal(girl.metadata.canonicalGroove, 'Pop-Rock', 'Jazz-Gypsy Jazz explicit groove normalizes to Pop-Rock.');

const blueTango = popDocuments.find(document => document.metadata.title === 'Blue Tango');
assert.ok(blueTango, 'Blue Tango is present in the pop source import.');
assert.equal(blueTango.metadata.canonicalGroove, 'Latin-Argentina: Tango', 'Blue Tango keeps the canonical tango groove.');
assert.equal(blueTango.metadata.defaultTempo, 130, 'Tango groove resolves to the documented default tempo.');

const brazilianDocuments = await createChartDocumentsFromIRealSource({
  sourcePath: path.join(projectRoot, 'parsing-projects', 'ireal', 'sources', 'brazilian-220.txt')
});
const aRita = brazilianDocuments.find(document => document.metadata.title === 'A Rita');
assert.ok(aRita, 'A Rita is present in the brazilian source import.');
assert.equal(aRita.metadata.canonicalGroove, 'Latin-Brazil: Samba', 'Samba style resolves to the canonical Brazilian samba groove.');
assert.equal(aRita.metadata.defaultTempo, 220, 'Samba style fallback resolves to the documented samba tempo.');

const aNovidade = brazilianDocuments.find(document => document.metadata.title === 'A Novidade');
assert.ok(aNovidade, 'A Novidade is present in the brazilian source import.');
assert.equal(aNovidade.metadata.canonicalGroove, 'Pop-Reggae', 'Reggae style resolves to Pop-Reggae.');
assert.equal(aNovidade.metadata.defaultTempo, 90, 'Pop-Reggae resolves to the documented default tempo.');

const latinDocuments = await createChartDocumentsFromIRealSource({
  sourcePath: path.join(projectRoot, 'parsing-projects', 'ireal', 'sources', 'latin-50.txt')
});
const chanChan = latinDocuments.find(document => document.metadata.title === 'Chan Chan');
assert.ok(chanChan, 'Chan Chan is present in the latin source import.');
assert.equal(chanChan.metadata.sourceRepeats, 4, 'Chan Chan keeps atypical source repeats metadata.');
const mamboInfluenciado = latinDocuments.find(document => document.metadata.title === 'Mambo Influenciado');
assert.ok(mamboInfluenciado, 'Mambo Influenciado is present in the latin source import.');
assert.equal(mamboInfluenciado.metadata.sourceRepeats, 10, 'Mambo Influenciado keeps large source repeats metadata.');

const fiveHundredMilesHigh = byTitle.get('500 Miles High');
assert.ok(fiveHundredMilesHigh, '500 Miles High is present in the raw source import.');
assert.ok(fiveHundredMilesHigh.bars.some(bar => bar.annotationMisc.includes('Q')), '500 Miles High preserves raw annotation misc tokens.');

const drillExport = createDrillExportFromPlaybackPlan(satinPlan, satinDoll);
assert.ok(drillExport.patternString.includes('|'), 'Drill export produces a bar-delimited pattern string.');
assert.ok(!drillExport.patternString.includes('%'), 'Drill export resolves repeated bars into concrete harmony.');

const cryMeARiver = byTitle.get('Cry Me A River');
assert.ok(cryMeARiver, 'Cry Me A River is present in the raw source import.');
const cryMeARiverPlan = createChartPlaybackPlanFromDocument(cryMeARiver);
const cryMeARiverExport = createDrillExportFromPlaybackPlan(cryMeARiverPlan, cryMeARiver);
assert.equal(cryMeARiver.bars[8].playback.cellSlots.length, 4, 'Cry Me A River keeps the four source iReal cell slots for the second ending bar.');
assert.deepEqual(
  cryMeARiverExport.engineBars[15].split(' '),
  ['Eb6', 'Eb6', 'Am7b5', 'D7b9b13'],
  'Cry Me A River expands the second ending bar from source cell positions into four Drill beats.'
);
const butterfly = byTitle.get('Butterfly');
assert.ok(butterfly, 'Butterfly is present in the raw source import.');
const butterflyPlan = createChartPlaybackPlanFromDocument(butterfly);
assert.ok(
  butterflyPlan.diagnostics.some(diagnostic => diagnostic.code === 'unsupported_repeat_hint'),
  'Playback diagnostics flag preserved repeat hints that are not yet interpreted.'
);

const normalizedDocument = createChartDocument({
  metadata: {
    title: 'Normalized',
    barCount: '3'
  },
  source: null,
  sections: [{ id: 'a', barIds: ['bar-1', null] }],
  bars: [{ id: 'bar-1', index: '1' }]
});
assert.equal(normalizedDocument.schemaVersion, CHART_DOCUMENT_CONTRACT.schemaVersion, 'Chart documents expose the stable schema version.');
assert.equal(normalizedDocument.metadata.id, '', 'Chart document metadata defaults missing ids to empty strings.');
assert.equal(normalizedDocument.metadata.barCount, 3, 'Chart document metadata normalizes bar counts.');
assert.deepEqual(normalizedDocument.sections[0].barIds, ['bar-1'], 'Chart document sections normalize bar id lists.');

const satinSession = createPracticeSessionFromChartDocument(satinDoll, { playbackPlan: satinPlan });
assert.equal(satinSession.schemaVersion, PRACTICE_SESSION_CONTRACT.schemaVersion, 'Practice sessions expose the stable schema version.');
assert.equal(satinSession.origin.mode, 'chart-document', 'Chart document sessions preserve their origin mode.');
assert.equal(satinSession.playback.patternString.includes('|'), true, 'Chart document sessions derive legacy playback strings.');

const satinSessionViaExplicitPlan = createPracticeSessionFromChartDocumentWithPlaybackPlan(satinDoll, satinPlan);
assert.deepEqual(
  satinSessionViaExplicitPlan.playback,
  satinSession.playback,
  'Explicit playback-plan session creation stays aligned with the chart-document helper.'
);

const selectedDocument = createSelectedChartDocument(satinDoll, ['bar-1', 'bar-2']);
assert.equal(selectedDocument.metadata.barCount, 2, 'Selected chart documents keep the normalized selected bar count.');
assert.equal(selectedDocument.layout, null, 'Selected chart documents intentionally drop layout metadata.');

const selectedSession = createPracticeSessionFromSelectedChartDocument(selectedDocument, {
  origin: {
    chartId: satinDoll.metadata.id,
    sourceKey: satinDoll.metadata.sourceKey,
    mode: 'chart-selection'
  }
});
assert.equal(selectedSession.selection.startBarId, 'bar-1', 'Selected chart document sessions infer the first selected bar.');
assert.equal(selectedSession.selection.endBarId, 'bar-2', 'Selected chart document sessions infer the last selected bar.');

const selectedSessionFromOriginal = createPracticeSessionFromChartSelection(satinDoll, {
  barIds: ['bar-1', 'bar-2'],
  startBarId: 'bar-1',
  endBarId: 'bar-2'
});
assert.deepEqual(
  selectedSessionFromOriginal.selection.barIds,
  ['bar-1', 'bar-2'],
  'Original chart selection sessions preserve the ordered selected ids.'
);
assert.equal(
  selectedSessionFromOriginal.origin.chartId,
  satinDoll.metadata.id,
  'Original chart selection sessions keep the source chart id from the unfiltered document.'
);

const walkingBassGenerator = createWalkingBassGenerator();
const f9BassLine = walkingBassGenerator.buildLine({
  chords: Array.from({ length: 4 }, () => ({
    semitones: 5,
    bassSemitones: 5,
    qualityMajor: '9',
    qualityMinor: '9',
    roman: 'IV',
    modifier: '9'
  })),
  key: 0,
  beatsPerChord: 1,
  isMinor: false
});
assert.equal(f9BassLine.length, 4, 'Walking bass generates four beats for a sustained F9 bar.');
