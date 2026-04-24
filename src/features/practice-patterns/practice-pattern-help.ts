
type PracticePatternHelpDom = {
  patternHelp?: HTMLElement | null;
};

type LoadPracticePatternHelpOptions = {
  dom?: PracticePatternHelpDom;
  url?: string;
  version?: string;
  fetchImpl?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
};

/**
 * Loads and renders the progression syntax help panel for the drill UI.
 *
 * @param {object} [options]
 * @param {PracticePatternHelpDom} [options.dom]
 * @param {string} [options.url]
 * @param {string} [options.version]
 * @param {(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>} [options.fetchImpl]
 */
export async function loadPracticePatternHelp({
  dom = {},
  url = '',
  version = '',
  fetchImpl = fetch
}: LoadPracticePatternHelpOptions = {}) {
  if (!dom.patternHelp) return;
  try {
    const response = await fetchImpl(`${url}?v=${version}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const groups = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    const formatPatternHelpLine = (line) => {
      const [syntaxPartRaw, ...commentParts] = line.split(/\s+\/\/\s*/);
      const syntaxPart = syntaxPartRaw.trim();
      const comment = commentParts.join(' // ').trim();
      const syntaxHtml = syntaxPart
        .split(/\s*,\s*/)
        .filter(Boolean)
        .map(item => `<code>${item}</code>`)
        .join(', ');

      if (!comment) return `<li>${syntaxHtml}</li>`;
      return `<li>${syntaxHtml} <span class="pattern-help-comment">// ${comment}</span></li>`;
    };

    const items = groups
      .map(formatPatternHelpLine)
      .join('');

    dom.patternHelp.innerHTML = `
      <summary class="pattern-help-title">Progression syntax</summary>
      <div class="pattern-help-body">
        <p>Use note roots such as <code>C Dm7 G7</code> or <code>F# B7 Emaj7</code>. Notes are interpreted relative to <code>C</code> by default. Separate chords with spaces.</p>
        <p>You can also use functions such as <code>IIm7 V I</code>, with optional <code>b</code> or <code>#</code> like <code>bVI</code> or <code>#IV</code>.</p>
        <p>If you omit the chord quality, a default one is chosen from the context. For example, <code>D</code> or <code>II</code> in minor will default to <code>m7b5</code>. Check with the <code>Progression preview</code> below.</p>
        <p>Available suffixes:</p>
        <ul>${items}</ul>
        <p><code>%</code> repeats the previous chord.</p>
        <p>You can also use <code>one:</code> for one-chord mode, for example <code>one:</code>, <code>one: all dominants</code>, or <code>one: maj7, m9, 7alt, dim7</code>.</p>
      </div>
    `;
  } catch {}
}


