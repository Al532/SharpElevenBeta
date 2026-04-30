const BETA_TOKEN_STORAGE_KEY = 'sharp-eleven-beta-token';
const BETA_FEEDBACK_PANEL_ID = 'sharp-eleven-beta-feedback-panel';
const BETA_FEEDBACK_BUTTON_ID = 'sharp-eleven-beta-feedback-button';
const BETA_GATE_LOGO_SRC = 'assets/se-logo-light.png';
const BETA_GATE_DARK_LOGO_SRC = 'assets/se-logo-dark.png';

type BetaAccessOptions = {
  installFeedback?: boolean;
};

type BetaTokenPayload = {
  exp?: number;
  sid?: string;
  scope?: string;
};

type BetaLoginResponse = {
  token?: string;
  expiresAt?: string;
};

type BetaFeedbackPayload = {
  message: string;
  page?: string;
  appVersion?: string;
};

function getEnvValue(key: string) {
  const env = import.meta.env as Record<string, string | boolean | undefined>;
  const value = env[key];
  return typeof value === 'string' ? value.trim() : value === true ? 'true' : '';
}

function isBetaGateEnabled() {
  return getEnvValue('VITE_BETA_GATE_ENABLED') === 'true';
}

function isLocalAppRuntime() {
  if (typeof window === 'undefined') return false;
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return protocol === 'file:'
    || hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname === '::1';
}

function removeLocalFeedbackLinks() {
  if (typeof document === 'undefined') return;
  document.querySelectorAll<HTMLAnchorElement>('a[href^="mailto:"]').forEach((link) => {
    const label = `${link.getAttribute('aria-label') || ''} ${link.getAttribute('title') || ''} ${link.textContent || ''}`.toLowerCase();
    if (!label.includes('feedback')) return;
    link.remove();
  });
}

function getSupabaseUrl() {
  return getEnvValue('VITE_SUPABASE_URL').replace(/\/+$/g, '');
}

function getSupabaseAnonKey() {
  return getEnvValue('VITE_SUPABASE_ANON_KEY');
}

function getFunctionName(key: string, fallback: string) {
  return getEnvValue(key) || fallback;
}

function getFunctionUrl(functionName: string) {
  const supabaseUrl = getSupabaseUrl();
  return supabaseUrl ? `${supabaseUrl}/functions/v1/${functionName}` : '';
}

function getBetaGateAssetUrl(relativePath: string) {
  const pageDirectory = window.location.pathname.replace(/[^/]*$/u, '');
  const appRootPrefix = pageDirectory.endsWith('/chart/') ? '../' : './';
  return `${appRootPrefix}${relativePath}`;
}

function getStoredBetaToken() {
  try {
    return window.localStorage.getItem(BETA_TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function storeBetaToken(token: string) {
  try {
    window.localStorage.setItem(BETA_TOKEN_STORAGE_KEY, token);
  } catch {
    // If storage is unavailable, keep the unlocked session in memory only.
  }
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return atob(padded);
}

function parseTokenPayload(token: string): BetaTokenPayload | null {
  const [, payload] = token.split('.');
  if (!payload) return null;
  try {
    return JSON.parse(decodeBase64Url(payload)) as BetaTokenPayload;
  } catch {
    return null;
  }
}

function hasUsableBetaToken(token: string) {
  const payload = parseTokenPayload(token);
  if (!payload?.exp) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp > nowSeconds + 10;
}

function getBetaRequestHeaders() {
  const anonKey = getSupabaseAnonKey();
  return {
    'Content-Type': 'application/json',
    ...(anonKey ? {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    } : {}),
  };
}

async function waitForBody() {
  if (document.body) return;
  await new Promise<void>((resolve) => {
    document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
  });
}

function createBetaGateElement() {
  const wrapper = document.createElement('div');
  const logoSrc = getBetaGateAssetUrl(BETA_GATE_LOGO_SRC);
  const darkLogoSrc = getBetaGateAssetUrl(BETA_GATE_DARK_LOGO_SRC);
  wrapper.className = 'beta-gate';
  wrapper.setAttribute('role', 'dialog');
  wrapper.setAttribute('aria-modal', 'true');
  wrapper.setAttribute('aria-labelledby', 'beta-gate-title');
  wrapper.innerHTML = `
    <form class="beta-gate-card">
      <div class="beta-gate-brand">
        <img class="beta-gate-logo" src="${logoSrc}" data-theme-dark-src="${darkLogoSrc}" alt="" width="44" height="44">
        <span>Sharp Eleven</span>
      </div>
      <h1 id="beta-gate-title">Beta access</h1>
      <label class="beta-gate-field">
        <span>Password</span>
        <input class="beta-gate-input" type="password" autocomplete="current-password" required autofocus>
      </label>
      <p class="beta-gate-status" role="status" aria-live="polite"></p>
      <button class="beta-gate-submit" type="submit">Enter</button>
    </form>
  `;
  return wrapper;
}

function setStatus(wrapper: HTMLElement, message: string, isError = false) {
  const status = wrapper.querySelector<HTMLElement>('.beta-gate-status');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('is-error', isError);
}

async function requestBetaToken(password: string): Promise<BetaLoginResponse> {
  const functionUrl = getFunctionUrl(getFunctionName('VITE_BETA_LOGIN_FUNCTION', 'beta-login'));
  if (!functionUrl || !getSupabaseAnonKey()) {
    throw new Error('Beta access is not configured.');
  }

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: getBetaRequestHeaders(),
    body: JSON.stringify({ password }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || 'Access denied.');
  }

  return payload as BetaLoginResponse;
}

async function promptForBetaAccess() {
  await waitForBody();

  const wrapper = createBetaGateElement();
  document.body.classList.add('beta-gate-active');
  document.body.appendChild(wrapper);

  const form = wrapper.querySelector<HTMLFormElement>('form');
  const input = wrapper.querySelector<HTMLInputElement>('input');
  const submit = wrapper.querySelector<HTMLButtonElement>('button[type="submit"]');

  input?.focus();

  await new Promise<void>((resolve) => {
    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const password = input?.value || '';
      if (!password.trim()) return;

      if (submit) submit.disabled = true;
      setStatus(wrapper, 'Checking access...');

      try {
        const result = await requestBetaToken(password);
        if (!result.token || !hasUsableBetaToken(result.token)) {
          throw new Error('The beta token was not accepted.');
        }

        storeBetaToken(result.token);
        document.body.classList.remove('beta-gate-active');
        wrapper.remove();
        resolve();
      } catch (error) {
        setStatus(wrapper, error instanceof Error ? error.message : 'Access denied.', true);
        if (submit) submit.disabled = false;
        input?.select();
      }
    });
  });
}

function getCurrentAppVersion() {
  try {
    return typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '';
  } catch {
    return '';
  }
}

async function submitBetaFeedback(payload: BetaFeedbackPayload) {
  const token = getStoredBetaToken();
  if (!hasUsableBetaToken(token)) {
    throw new Error('Beta access expired. Refresh the page and enter the password again.');
  }

  const functionUrl = getFunctionUrl(getFunctionName('VITE_BETA_FEEDBACK_FUNCTION', 'beta-feedback'));
  if (!functionUrl || !getSupabaseAnonKey()) {
    throw new Error('Feedback is not configured.');
  }

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      ...getBetaRequestHeaders(),
      'x-beta-token': token,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.error || 'Feedback could not be sent.');
  }
}

function closeFeedbackPanel() {
  document.getElementById(BETA_FEEDBACK_PANEL_ID)?.remove();
}

function openFeedbackPanel() {
  closeFeedbackPanel();

  const panel = document.createElement('div');
  panel.id = BETA_FEEDBACK_PANEL_ID;
  panel.className = 'beta-feedback-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'beta-feedback-title');
  panel.innerHTML = `
    <form class="beta-feedback-card">
      <div class="beta-feedback-header">
        <h2 id="beta-feedback-title">Feedback</h2>
        <button class="beta-feedback-close" type="button" aria-label="Close feedback">Close</button>
      </div>
      <textarea class="beta-feedback-input" required maxlength="4000" placeholder="What should I fix, polish, or keep?"></textarea>
      <p class="beta-feedback-status" role="status" aria-live="polite"></p>
      <div class="beta-feedback-actions">
        <button class="beta-feedback-submit" type="submit">Send</button>
      </div>
    </form>
  `;
  document.body.appendChild(panel);

  const textarea = panel.querySelector<HTMLTextAreaElement>('textarea');
  const form = panel.querySelector<HTMLFormElement>('form');
  const closeButton = panel.querySelector<HTMLButtonElement>('.beta-feedback-close');
  const submitButton = panel.querySelector<HTMLButtonElement>('.beta-feedback-submit');
  const status = panel.querySelector<HTMLElement>('.beta-feedback-status');

  textarea?.focus();
  closeButton?.addEventListener('click', closeFeedbackPanel);
  panel.addEventListener('click', (event) => {
    if (event.target === panel) closeFeedbackPanel();
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = textarea?.value.trim() || '';
    if (!message) return;

    if (submitButton) submitButton.disabled = true;
    if (status) {
      status.textContent = 'Sending...';
      status.classList.remove('is-error');
    }

    try {
      await submitBetaFeedback({
        message,
        page: window.location.pathname,
        appVersion: getCurrentAppVersion(),
      });
      if (status) status.textContent = 'Thanks, received.';
      if (textarea) textarea.value = '';
      window.setTimeout(closeFeedbackPanel, 850);
    } catch (error) {
      if (status) {
        status.textContent = error instanceof Error ? error.message : 'Feedback could not be sent.';
        status.classList.add('is-error');
      }
      if (submitButton) submitButton.disabled = false;
    }
  });
}

function installBetaFeedbackButton() {
  if (!isBetaGateEnabled() || isLocalAppRuntime() || document.getElementById(BETA_FEEDBACK_BUTTON_ID)) return;
  const button = document.createElement('button');
  button.id = BETA_FEEDBACK_BUTTON_ID;
  button.className = 'beta-feedback-button';
  button.type = 'button';
  button.textContent = 'Feedback';
  button.addEventListener('click', openFeedbackPanel);
  document.body.appendChild(button);
}

export async function enforceBetaAccess({ installFeedback = true }: BetaAccessOptions = {}) {
  if (isLocalAppRuntime()) {
    await waitForBody();
    removeLocalFeedbackLinks();
    closeFeedbackPanel();
    document.getElementById(BETA_FEEDBACK_BUTTON_ID)?.remove();
    document.body.classList.remove('beta-gate-active');
    document.querySelector('.beta-gate')?.remove();
    return;
  }

  if (!isBetaGateEnabled() || typeof window === 'undefined') return;

  await waitForBody();

  const storedToken = getStoredBetaToken();
  if (!hasUsableBetaToken(storedToken)) {
    await promptForBetaAccess();
  }

  if (installFeedback) installBetaFeedbackButton();
}

declare const __APP_VERSION__: string | undefined;
