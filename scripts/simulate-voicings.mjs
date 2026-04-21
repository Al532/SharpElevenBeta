// Simulation des voicings — trouve les notes MIDI réellement utilisées
const VIOLIN_LOW = 56;
const VIOLIN_HIGH = 84; // nouvelle limite arbitraire (MIDI C6)
const CELLO_LOW = 37;

const INTERVAL_MAP = {
  '1':0,'b2':1,'2':2,'b3':3,'3':4,'4':5,'#4':6,'b5':6,'5':7,'#5':8,'b6':8,
  '6':9,'b7':10,'bb7':9,'7':11,'b9':1,'9':2,'#9':3,'11':5,'#11':6,'b13':8,'13':9
};
function resolveInterval(s) { return INTERVAL_MAP[s]; }
function resolveIntervalList(arr) { return arr.map(resolveInterval); }

const GUIDE_TONES = {
  dom: ['3','b7'], m7: ['b3','b7'], m9: ['b3','b7'], m6: ['b3','6'],
  maj7: ['3','7'], '6': ['3','6'], hdim: ['b5','b7'], dim: ['b3','bb7'], lyd: ['3','5']
};
const COLOR_TONES = {
  m7: ['5','b7'], m9: ['5','9'], m6: ['5','9'], maj7: ['5','9'], '6': ['5','9'],
  hdim: ['b3','b7'], dim: ['b5'], lyd: ['9','#11','13']
};
const DOMINANT_COLOR_TONES = {
  mixo: ['9','13'], b9: ['b9','b13'], alt: ['b9','#9','b13'], oct: ['b9','13'],
  lyd: ['9','6','#11'], '#5': ['9','#5'], '#9': ['#9','b7'], sus: ['9','13'], b9sus: ['4','5','b9']
};
const DOMINANT_GUIDE_TONES = { sus: ['4','b7'], b9sus: ['b7'] };

function buildBase(rootPc, qualityCat, colorToneInts, guideToneInts, bassPc = rootPc) {
  let bassNote = bassPc;
  while (bassNote < CELLO_LOW) bassNote += 12;
  const guideIntervals = guideToneInts ?? resolveIntervalList(GUIDE_TONES[qualityCat]);
  const guideTones = guideIntervals.map(interval => {
    const pc = (rootPc + interval) % 12;
    return pc === 0 ? 60 : 48 + pc;
  });
  const bassMatchesGuideIndex = guideTones.findIndex(midi => (midi % 12) === bassPc);
  if (bassMatchesGuideIndex !== -1) {
    let rootGuideReplacement = rootPc;
    while (rootGuideReplacement <= bassNote || rootGuideReplacement < 49) rootGuideReplacement += 12;
    while (rootGuideReplacement > 60) rootGuideReplacement -= 12;
    if (rootGuideReplacement < 49) rootGuideReplacement += 12;
    guideTones[bassMatchesGuideIndex] = rootGuideReplacement;
  }
  const uniqueGuideTones = [...new Set(guideTones)];
  const topGuide = Math.max(...uniqueGuideTones);
  const colorPitchClasses = [...new Set(colorToneInts.map(i => (rootPc + i) % 12))];
  if (bassPc !== rootPc && bassMatchesGuideIndex === -1 && !colorPitchClasses.includes(rootPc)) {
    colorPitchClasses.push(rootPc);
  }
  return { bassNote, guideTones: uniqueGuideTones, colorPitchClasses, topGuide };
}

function getCandidates(pc, minExcl) {
  const midis = [];
  let midi = pc;
  while (midi <= minExcl || midi < VIOLIN_LOW) midi += 12;
  while (midi <= VIOLIN_HIGH) { midis.push(midi); midi += 12; }
  return midis;
}

function getGapFillCandidates(lowerNote, upperNote, colorPcs, existing) {
  const candidates = [], seen = new Set();
  for (const pc of colorPcs) {
    let midi = pc;
    while (midi <= lowerNote || midi < VIOLIN_LOW) midi += 12;
    while (midi < upperNote && midi <= VIOLIN_HIGH) {
      if (!existing.has(midi) && !seen.has(midi)) { candidates.push(midi); seen.add(midi); }
      midi += 12;
    }
  }
  return candidates;
}

function pickBest(lowerNote, upperNote, candidates) {
  if (!candidates.length) return null;
  const midpoint = (lowerNote + upperNote) / 2;
  return candidates.slice().sort((a, b) => {
    const aG = Math.max(a - lowerNote, upperNote - a);
    const bG = Math.max(b - lowerNote, upperNote - b);
    if (aG !== bG) return aG - bG;
    return Math.abs(a - midpoint) - Math.abs(b - midpoint);
  })[0];
}

function fillGaps(guideTones, colorTones, colorPcs) {
  const aug = [...colorTones];
  while (true) {
    const upperNotes = [...guideTones, ...aug].sort((a, b) => a - b);
    let widest = null;
    for (let i = 1; i < upperNotes.length; i++) {
      const gap = upperNotes[i] - upperNotes[i-1];
      if (gap > 12 && (!widest || gap > widest.gap))
        widest = { lowerNote: upperNotes[i-1], upperNote: upperNotes[i], gap };
    }
    if (!widest) return aug.sort((a, b) => a - b);
    const filler = pickBest(widest.lowerNote, widest.upperNote,
      getGapFillCandidates(widest.lowerNote, widest.upperNote, colorPcs, new Set(upperNotes)));
    if (filler === null) return null;
    aug.push(filler);
  }
}

function computeVoicing(rootPc, qualityCat, colorIntervals, guideIntervals, bassPc = rootPc) {
  const colorToneInts = resolveIntervalList(colorIntervals);
  const guideToneInts = guideIntervals ? resolveIntervalList(guideIntervals) : null;
  const { bassNote, guideTones, colorPitchClasses, topGuide } = buildBase(rootPc, qualityCat, colorToneInts, guideToneInts, bassPc);
  if (colorPitchClasses.length === 0) return { bassNote, guideTones, colorTones: [] };
  const opts = colorPitchClasses.map(pc => getCandidates(pc, topGuide));
  if (opts.some(o => o.length === 0)) return null;

  const candidateMap = new Map();
  const current = new Array(opts.length);
  function visit(i) {
    if (i >= opts.length) {
      const ct = [...current].sort((a, b) => a - b);
      const filled = fillGaps(guideTones, ct, colorPitchClasses);
      if (!filled) return;
      const key = filled.join(',');
      if (!candidateMap.has(key)) candidateMap.set(key, { bassNote, guideTones, colorTones: filled });
      return;
    }
    for (const m of opts[i]) { current[i] = m; visit(i+1); }
  }
  visit(0);

  const candidates = [...candidateMap.values()].sort((a, b) => {
    const topA = a.colorTones.length ? a.colorTones[a.colorTones.length-1] : Math.max(...a.guideTones);
    const topB = b.colorTones.length ? b.colorTones[b.colorTones.length-1] : Math.max(...b.guideTones);
    return topA - topB;
  });
  return candidates[0] ?? null;
}

function enumerateVoicings(rootPc, qualityCat, colorIntervals, guideIntervals, bassPc = rootPc) {
  const colorToneInts = resolveIntervalList(colorIntervals);
  const guideToneInts = guideIntervals ? resolveIntervalList(guideIntervals) : null;
  const { bassNote, guideTones, colorPitchClasses, topGuide } = buildBase(rootPc, qualityCat, colorToneInts, guideToneInts, bassPc);
  if (colorPitchClasses.length === 0) return [{ bassNote, guideTones, colorTones: [] }];
  const opts = colorPitchClasses.map(pc => getCandidates(pc, topGuide));
  if (opts.some(o => o.length === 0)) return [];

  const candidateMap = new Map();
  const current = new Array(opts.length);
  function visit(i) {
    if (i >= opts.length) {
      const ct = [...current].sort((a, b) => a - b);
      const filled = fillGaps(guideTones, ct, colorPitchClasses);
      if (!filled) return;
      const key = filled.join(',');
      if (!candidateMap.has(key)) candidateMap.set(key, { bassNote, guideTones, colorTones: filled });
      return;
    }
    for (const m of opts[i]) { current[i] = m; visit(i+1); }
  }
  visit(0);
  return [...candidateMap.values()];
}

// Collect all notes across ALL voicing candidates (not just the minimum)
const celloNotes = new Set(), violinNotes = new Set(), pianoNotes = new Set();

for (let rootPc = 0; rootPc < 12; rootPc++) {
  for (const [cat, colorIntervals] of Object.entries(COLOR_TONES)) {
    for (const v of enumerateVoicings(rootPc, cat, colorIntervals, null)) {
      celloNotes.add(v.bassNote);
      for (const m of v.guideTones) celloNotes.add(m);
      for (const m of v.colorTones) violinNotes.add(m);
      for (const m of v.guideTones) pianoNotes.add(m);
      for (const m of v.colorTones) pianoNotes.add(m);
    }
  }
  for (const [subtype, colorIntervals] of Object.entries(DOMINANT_COLOR_TONES)) {
    const guideIntervals = DOMINANT_GUIDE_TONES[subtype] ?? null;
    for (const v of enumerateVoicings(rootPc, 'dom', colorIntervals, guideIntervals)) {
      celloNotes.add(v.bassNote);
      for (const m of v.guideTones) celloNotes.add(m);
      for (const m of v.colorTones) violinNotes.add(m);
      for (const m of v.guideTones) pianoNotes.add(m);
      for (const m of v.colorTones) pianoNotes.add(m);
    }
  }
}

