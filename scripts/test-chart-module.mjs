import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createChartPlaybackPlanFromDocument,
  createChartViewModel,
  createDrillExportFromPlaybackPlan
} from '../chart/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const fixturePath = path.join(projectRoot, 'chart-dev', 'fixtures', 'chart-fixtures.json');

const fixtureLibrary = JSON.parse(await readFile(fixturePath, 'utf8'));
const byTitle = new Map(fixtureLibrary.documents.map(document => [document.metadata.title, document]));

const satinDoll = byTitle.get('Satin Doll');
assert.ok(satinDoll, 'Satin Doll fixture is present.');
assert.ok(satinDoll.bars.some(bar => bar.endings.includes(1)), 'Satin Doll keeps first ending.');
assert.ok(satinDoll.bars.some(bar => bar.endings.includes(2)), 'Satin Doll keeps second ending.');
assert.ok(satinDoll.bars.some(bar => bar.notation.kind === 'single_bar_repeat'), 'Satin Doll keeps repeat display bars.');

const alice = byTitle.get('Alice In Wonderland');
assert.ok(alice, 'Alice In Wonderland fixture is present.');
assert.ok(alice.bars.some(bar => bar.directives.some(directive => directive.type === 'dc_al_ending')), 'Alice keeps D.C. al ending.');
assert.ok(alice.bars.some(bar => bar.flags.includes('fine')), 'Alice keeps Fine.');

const bodyAndSoul = byTitle.get('Body And Soul');
assert.ok(bodyAndSoul, 'Body And Soul fixture is present.');
assert.ok(bodyAndSoul.bars.some(bar => bar.playback.slots.some(slot => slot.bass)), 'Body And Soul keeps slash chords.');

const allTheThings = byTitle.get('All The Things You Are');
assert.ok(allTheThings, 'All The Things You Are fixture is present.');
assert.equal(allTheThings.sections.length >= 3, true, 'All The Things You Are keeps multiple sections.');

const stella = byTitle.get('Stella By Starlight');
assert.ok(stella, 'Stella fixture is present.');
assert.ok(stella.bars.some(bar => bar.playback.slots.some(slot => slot.alternate)), 'Stella keeps alternate harmony markers.');

const satinPlan = createChartPlaybackPlanFromDocument(satinDoll);
assert.ok(satinPlan.entries.length > satinDoll.bars.length, 'Satin Doll playback expands the repeat.');

const alicePlan = createChartPlaybackPlanFromDocument(alice);
assert.ok(alicePlan.entries.some(entry => entry.flags.includes('fine')), 'Alice playback reaches Fine.');

const viewModel = createChartViewModel(bodyAndSoul, { displayTransposeSemitones: 2 });
assert.equal(bodyAndSoul.metadata.sourceKey, 'Db', 'Source document key stays unchanged.');
assert.notEqual(viewModel.metadata.displayKey, bodyAndSoul.metadata.sourceKey, 'Display key transposes in view model.');

const drillExport = createDrillExportFromPlaybackPlan(satinPlan, satinDoll);
assert.ok(drillExport.patternString.includes('|'), 'Drill export produces a bar-delimited pattern string.');
assert.ok(!drillExport.patternString.includes('%'), 'Drill export resolves repeated bars into concrete harmony.');

console.log('Chart module tests passed.');
