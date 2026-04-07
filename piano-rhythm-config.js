const pianoRhythmConfig = {
  resetBeatStartProbability: 0.35,
  brokenLongOnBeatProbability: 0.3,
  noteTimingHumanizeMs: 0,
  offbeatVolumeSpread: 0.6,
  oddEvenBeatVolumeSpread: 0.3,
  onBeatJumpWeights: {
    2: 2,
    3: 6,
    4: 3,
    5: 1,
    6: 1,
  },
  offBeatJumpWeights: {
    2: 3,
    3: 6,
    4: 4,
    5: 1,
    6: 1,
  },
};

export default pianoRhythmConfig;
