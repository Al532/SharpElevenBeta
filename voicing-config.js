const JAZZ_TRAINER_CONFIG = {
  // Default chord quality per diatonic degree (major scale context)
  DEGREE_QUALITY_MAJOR: {
    I: '6', II: 'm9', III: 'm7', IV: '△7',
    V: '7', VI: 'm7', VII: 'ø7'
  },

  // Altered degree quality by resulting semitone (major context)
  ALTERED_SEMITONE_QUALITY_MAJOR: {
    1: '△7', // bII / #I
    3: '°7', // bIII / #II
    6: 'ø7', // bV / #IV
    8: '7',  // bVI / #V
    10: '7'  // bVII / #VI
  },

  // Default chord quality per diatonic degree (minor scale context)
  DEGREE_QUALITY_MINOR: {
    I: 'm6', II: 'ø7', III: '7', IV: 'm6',
    V: '7b9', VI: 'ø7', VII: '°7'
  },

  // Altered degree quality by resulting semitone (minor context)
  ALTERED_SEMITONE_QUALITY_MINOR: {
    1: '△7', // bII / #I
    3: '°7', // bIII / #II
    6: '°7', // bV / #IV
    8: '7',  // bVI / #V
    10: '7'  // bVII / #VI
  },

  // Guide tones per quality category
  GUIDE_TONES: {
    dom: ['3', 'b7'],
    m7: ['b3', 'b7'],
    m9: ['b3', 'b7'],
    m11: ['b7'],
    m6: ['b3', '6'],
    maj7: ['3', '7'],
    '6': ['3', '6'],
    hdim: ['b5', 'b7'],
    dim: ['b3', 'bb7'],
    lyd: ['3', '5']
  },

  // Color tones per quality (non-dominant)
  COLOR_TONES: {
    m7: ['5', 'b7'],
    m9: ['5', '9'],
    m11: ['b3','4','5','9'],
    m6: ['5', '9'],
    maj7: ['5', '9'],
    '6': ['5', '9'],
    hdim: ['b3', 'b7'],
    dim: ['b5'],
    lyd: ['9', "#11", '13']
  },

  // Dominant color tones per subtype
  DOMINANT_COLOR_TONES: {
    mixo: ['9', '13'],
    b9: ['b9', 'b13'],
    alt: ['b9', '#9', 'b13'],
    oct: ['b9', '13'],
    lyd: ['9', '6', '#11'],
    sus: ['9', '13'],
    b9sus: ['4', '5', 'b9']
  },

  // Dominant guide tones per subtype when they differ from the default dominant 3 + b7
  DOMINANT_GUIDE_TONES: {
    sus: ['4', 'b7'],
    b9sus: ['b7']
  },

  // Accepted textual aliases for quality families
  QUALITY_CATEGORY_ALIASES: {
    m7: ['m7'],
    m9: ['m9'],
    m11: ['m11'],
    m6: ['m6'],
    maj7: ['△7', 'maj7', '△9'],
    '6': ['6'],
    hdim: ['ø7', 'm7b5'],
    dim: ['°7', 'dim7'],
    lyd: ['lyd']
  },

  // Accepted dominant suffixes after the leading "7"
  DOMINANT_SUBTYPE_SUFFIXES: {
    mixo: ['mixo'],
    b9: ['b9'],
    alt: ['alt'],
    oct: ['oct'],
    lyd: ['lyd'],
    sus: ['sus'],
    b9sus: ['b9sus']
  }
};

window.JAZZ_TRAINER_CONFIG = JAZZ_TRAINER_CONFIG;

export default JAZZ_TRAINER_CONFIG;
