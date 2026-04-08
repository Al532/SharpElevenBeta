const ANALYTICS_DISABLED_STORAGE_KEY = 'jazzTrainerAnalyticsDisabled';
const ANALYTICS_VISITOR_ID_STORAGE_KEY = 'jazzTrainerAnonymousVisitorId';
const ANALYTICS_VISITOR_FIRST_SEEN_STORAGE_KEY = 'jazzTrainerVisitorFirstSeenDay';
const ANALYTICS_VISITOR_LAST_SEEN_STORAGE_KEY = 'jazzTrainerVisitorLastSeenDay';
const ANALYTICS_VISITOR_LAST_RETURN_TRACKED_STORAGE_KEY = 'jazzTrainerVisitorLastReturnTrackedDay';
const ANALYTICS_FLAG_QUERY_PARAM = 'internal';
const GOATCOUNTER_SCRIPT_SRC = '//gc.zgo.at/count.js';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const GOATCOUNTER_CONFIG_KEY = 'JAZZ_TRAINER_GOATCOUNTER_ENDPOINT';
const TRACKING_KEY_PRIORITY = [
  'progression_id',
  'tempo',
  'repetitions_per_key',
  'comping_style',
  'progression_source',
  'progression_mode',
  'progression_kind',
  'progression_shape',
  'tempo_bucket',
  'drums_mode',
  'display_mode',
  'tonal_mode',
  'transposition',
  'double_time',
  'alternate_display',
  'enabled_keys',
  'volume_percent',
  'restored_count',
  'preset_count',
  'key_state',
  'key_index',
  'share_network',
  'location',
  'visitor_state',
  'return_gap_bucket'
];

let analyticsBootstrapped = false;

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function getHostname() {
  if (!isBrowser()) return '';
  return window.location.hostname || '';
}

function shouldDisableForLocalHost() {
  return LOCAL_HOSTS.has(getHostname());
}

function persistDisabledState(disabled) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(ANALYTICS_DISABLED_STORAGE_KEY, disabled ? '1' : '0');
  } catch {
    // Ignore storage failures; analytics will simply use the in-memory default.
  }
}

function readStoredDisabledState() {
  if (!isBrowser()) return false;
  try {
    return window.localStorage.getItem(ANALYTICS_DISABLED_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function syncDisabledStateFromQueryParam() {
  if (!isBrowser()) return;
  const params = new URLSearchParams(window.location.search);
  const flag = params.get(ANALYTICS_FLAG_QUERY_PARAM);
  if (flag === '1') {
    persistDisabledState(true);
  } else if (flag === '0') {
    persistDisabledState(false);
  }
}

function isAnalyticsDisabled() {
  return shouldDisableForLocalHost() || readStoredDisabledState();
}

function readStorageValue(key) {
  if (!isBrowser()) return '';
  try {
    return window.localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function writeStorageValue(key, value) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures; analytics will continue without persisted visitor state.
  }
}

export function getAnalyticsDebugEnabled() {
  return isAnalyticsDisabled();
}

export function setAnalyticsDebugEnabled(enabled) {
  persistDisabledState(Boolean(enabled));
  if (!enabled) {
    ensureGoatCounterScript();
  }
}

function getGoatCounterEndpoint() {
  if (!isBrowser()) return;
  const raw = window[GOATCOUNTER_CONFIG_KEY];
  if (typeof raw !== 'string') return '';
  return raw.trim();
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDayKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getDaysBetween(startDayKey, endDayKey) {
  const start = parseDayKey(startDayKey);
  const end = parseDayKey(endDayKey);
  if (!start || !end) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end - start) / msPerDay);
}

function getReturnGapBucket(gapDays) {
  if (!Number.isFinite(gapDays) || gapDays < 1) return 'same_day';
  if (gapDays === 1) return 'next_day';
  if (gapDays <= 7) return 'same_week';
  if (gapDays <= 30) return 'same_month';
  return 'gt_30d';
}

function createAnonymousVisitorId() {
  if (typeof crypto?.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `anon_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
}

function getOrCreateAnonymousVisitorId() {
  const storedId = readStorageValue(ANALYTICS_VISITOR_ID_STORAGE_KEY);
  if (storedId) return storedId;
  const nextId = createAnonymousVisitorId();
  writeStorageValue(ANALYTICS_VISITOR_ID_STORAGE_KEY, nextId);
  return nextId;
}

function ensureGoatCounterStub() {
  if (!isBrowser()) return false;
  if (typeof window.goatcounter?.count === 'function') return true;
  if (!window.goatcounter || typeof window.goatcounter !== 'object') {
    window.goatcounter = {};
  }
  if (typeof window.goatcounter.count !== 'function') {
    window.goatcounter.count = function goatCounterProxy(vars) {
      (window.goatcounter.q = window.goatcounter.q || []).push(vars);
    };
  }
  return true;
}

function ensureGoatCounterScript() {
  if (!isBrowser()) return false;
  if (document.querySelector('script[data-jazz-goatcounter="true"]')) return true;

  const endpoint = getGoatCounterEndpoint();
  if (!endpoint || isAnalyticsDisabled()) return false;

  ensureGoatCounterStub();

  const script = document.createElement('script');
  script.defer = true;
  script.dataset.noOnload = 'true';
  script.dataset.goatcounter = endpoint;
  script.dataset.jazzGoatcounter = 'true';
  script.src = GOATCOUNTER_SCRIPT_SRC;
  document.head.appendChild(script);
  return true;
}

export function initAnalytics() {
  if (!isBrowser() || analyticsBootstrapped) return;
  analyticsBootstrapped = true;
  syncDisabledStateFromQueryParam();
  ensureGoatCounterScript();
  trackVisitorLifecycle();
}

function normalizeProps(props = {}) {
  return Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

function toToken(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function getTrackingSegments(props) {
  const normalizedProps = normalizeProps(props);
  return TRACKING_KEY_PRIORITY
    .filter(key => Object.prototype.hasOwnProperty.call(normalizedProps, key))
    .map(key => {
      const token = toToken(normalizedProps[key]);
      return token ? `${key}:${token}` : '';
    })
    .filter(Boolean)
    .slice(0, 4);
}

function buildEventPath(name, props) {
  const base = `/event/${toToken(name) || 'unknown'}`;
  const segments = getTrackingSegments(props);
  return segments.length > 0 ? `${base}/${segments.join('/')}` : base;
}

function buildEventTitle(name, props) {
  const normalizedProps = normalizeProps(props);
  const summary = Object.entries(normalizedProps)
    .slice(0, 6)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
  return summary ? `${name} (${summary})` : name;
}

export function trackEvent(name, props = {}) {
  if (!name || isAnalyticsDisabled()) return;
  const loaded = ensureGoatCounterScript();
  if (!loaded || !ensureGoatCounterStub()) return;
  window.goatcounter.count({
    path: () => buildEventPath(name, props),
    title: buildEventTitle(name, props),
    event: true
  });
}

function trackVisitorLifecycle() {
  if (isAnalyticsDisabled()) return;

  getOrCreateAnonymousVisitorId();

  const today = getTodayKey();
  const firstSeenDay = readStorageValue(ANALYTICS_VISITOR_FIRST_SEEN_STORAGE_KEY);
  if (!firstSeenDay) {
    writeStorageValue(ANALYTICS_VISITOR_FIRST_SEEN_STORAGE_KEY, today);
    writeStorageValue(ANALYTICS_VISITOR_LAST_SEEN_STORAGE_KEY, today);
    trackEvent('visitor_session', {
      visitor_state: 'new'
    });
    trackEvent('visitor_first_seen', {
      visitor_state: 'new'
    });
    return;
  }

  const lastSeenDay = readStorageValue(ANALYTICS_VISITOR_LAST_SEEN_STORAGE_KEY) || firstSeenDay;
  if (lastSeenDay === today) {
    trackEvent('visitor_session', {
      visitor_state: 'same_day'
    });
    return;
  }

  writeStorageValue(ANALYTICS_VISITOR_LAST_SEEN_STORAGE_KEY, today);

  const lastReturnTrackedDay = readStorageValue(ANALYTICS_VISITOR_LAST_RETURN_TRACKED_STORAGE_KEY);
  const gapDays = getDaysBetween(lastSeenDay, today);
  const returnGapBucket = getReturnGapBucket(gapDays);
  trackEvent('visitor_session', {
    visitor_state: 'returning',
    return_gap_bucket: returnGapBucket
  });

  if (lastReturnTrackedDay === today) return;

  trackEvent('visitor_returned', {
    visitor_state: 'returning',
    return_gap_bucket: returnGapBucket
  });
  writeStorageValue(ANALYTICS_VISITOR_LAST_RETURN_TRACKED_STORAGE_KEY, today);
}

initAnalytics();
