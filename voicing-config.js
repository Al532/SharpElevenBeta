const JAZZ_TRAINER_CONFIG = {
  // Default chord quality per diatonic degree (major scale context)
  DEGREE_QUALITY_MAJOR: {
    I: '6', II: 'm7', III: 'm7', IV: '△7',
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
    V: '7b13', VI: 'ø7', VII: '°7'
  },

  // Altered degree quality by resulting semitone (minor context)
  ALTERED_SEMITONE_QUALITY_MINOR: {
    1: '△7', // bII / #I
    3: 'maj7', // bIII / #II
    6: '°7', // bV / #IV
    8: '7',  // bVI / #V
    10: '7'  // bVII / #VI
  },

  // Guide tones per quality category
  GUIDE_TONES: {
    dom: ['3', 'b7'],
    m7: ['b3', 'b7'],
    m9: ['b3', 'b7'],
    m6: ['b3', '6'],
    mMaj7: ['b3', '6'],
    maj7: ['3', '7'],
    '6': ['3', '6'],
    m7b5: ['b5', 'b7'],
    dim7: ['b3', 'bb7'],
    lyd: ['3', '5']
  },

  // Color tones per quality (non-dominant)
  COLOR_TONES: {
    m7: ['5', 'b7'],
    m9: ['5', '9'],
    m6: ['5', '9'],
    mMaj7: ['9', '5', '7'],
    maj7: ['5', '9'],
    '6': ['5', '9'],
    m7b5: ['b3', 'b7'],
    dim7: ['b5'],
    lyd: ['9', '#11', '13']
  },

  // Dominant color tones per full quality syntax
  DOMINANT_COLOR_TONES: {
    '13': ['9', '13'],
    '9': ['9', '5'],
    '7b9': ['b9', '5'],
    '7b13': ['b9', 'b13'],
    '7alt': ['b9', '#9', 'b13'],
    '13b9': ['b9', '13'],
    '13#11': ['9', '6', '#11'],
    '7#5': ['9', '#5'],
    '7#9': ['#9', 'b7'],
    '13sus': ['9', '13'],
    '9sus': ['9', '5'],
    '7b9sus': ['4', '5', 'b9']
  },

  // Dominant guide tones per full quality when they differ from the default dominant 3 + b7
  DOMINANT_GUIDE_TONES: {
    '13sus': ['4', 'b7'],
    '9sus': ['4', 'b7'],
    '7b9sus': ['b7']
  },

  // Default dominant quality for a bare "7" quality, by strict diatonic degree and mode
  // These mappings apply only to unaltered degrees (II, III, etc.), not to bII / #IV / etc.
  DOMINANT_DEFAULT_QUALITY_MAJOR: {
    II: '13',
    III: '7b13',
    VI: '7b13',
    VII: '7#5'
  },

  DOMINANT_DEFAULT_QUALITY_MINOR: {
    II: '7b13',
    III: '7b13',
    V: '7b13',
    VI: '7b13',
    VII: '7b13'
  },

  // Accepted textual aliases for dominant qualities that share the same behavior
  DOMINANT_QUALITY_ALIASES: {
    '13': ['7mixo', '13mixo', 'mixo'],
    '9': [],
    '7b9': [],
    '7b13': [],
    '7alt': ['alt'],
    '13b9': ['7oct', 'oct', '13oct'],
    '13#11': ['7#11', '7lyd', '13lyd'],
    '7#5': ['9#5'],
    '7#9': [],
    '13sus': [],
    '9sus': ['7sus'],
    '7b9sus': []
  },

  // Accepted textual aliases for quality families
  QUALITY_CATEGORY_ALIASES: {
    m7: [],
    m9: [],
    m6: [],
    mMaj7: ['mmaj7', 'mmaj9'],
    maj7: ['△7', 'maj9', '△9'],
    '6': [],
    m7b5: ['ø7'],
    dim7: ['°7', 'dim'],
    lyd: ['maj#11', 'maj7#11', '△#11']
  }
};

export default JAZZ_TRAINER_CONFIG;
