const PIANO_VOICING_CONFIG = {
  defaultMode: 'piano',

  ranges: {
    lowestNoteZoneLow: 49,
    lowestNoteZoneHigh: 57,
    lowestNoteZoneCenter: 53,
    noteRangeLow: 45,
    noteRangeHigh: 89,
  },

  modes: {
    piano: {
      guideToneIndices: [0, 2],
      shapes: {
        m7: { A: ['b3', '5', 'b7', '1'] },
        m9: { A: ['b3', '5', 'b7', '9'] },
        m6: { A: ['b3', '5', '6', '9'] },
        mMaj7: { A: ['b3', '5', '7', '9'] },
        maj7: { A: ['3', '5', '7', '9'] },
        '6': { A: ['3', '5', '6', '9'] },
        m7b5: { A: ['b3', 'b5', 'b7', '1'] },
        dim7: { A: ['b3', 'b5', '6', '1'] },
        // TODO: add mb6 voicing (minor b6 / minor augmented — rare, from iReal -#5/-b6)
        // mb6: { A: [...] },
        lyd: { A: ['3', '#11', '7', '9'] },
        '13': { A: ['3', '13', 'b7', '9'] },
        '9': { A: ['3', '5', 'b7', '9'] },
        '7b9': { A: ['3', '5', 'b7', 'b9'] },
        '7b9b13': { A: ['3', 'b13', 'b7', 'b9'] },
        '7alt': { A: ['3', 'b13', 'b7', '#9'] },
        '13b9': { A: ['3', '13', 'b7', 'b9'] },
        '13#11': { A: ['3', '13', 'b7', '9'] },
        '7#5': { A: ['3', '#5', 'b7', '9'] },
        '7#9': { A: ['3', 'b7', '#9'] },
        '13sus': { A: ['4', '13', 'b7', '9'] },
        '9sus': { A: ['4', '5', 'b7', '9'] },
        '7b9sus': { A: ['4', '5', 'b7', 'b9'] },
      },
    },
    twoHand: {
      guideToneIndices: [0, 1],
      shapes: {
        // Optional overrides only.
        // If a quality is omitted here, the two-hand voicing is derived from
// the one-hand shape using the drop/doubling rule in drill-comping-piano.js.
        //
        // Example:
        // m9: {
        //   A: ['b3', 'b7', '9', '5'],
        //   B: ['b7', '9', 'b3', '5'],
        // },
      },
    },
  },
};

export default PIANO_VOICING_CONFIG;
