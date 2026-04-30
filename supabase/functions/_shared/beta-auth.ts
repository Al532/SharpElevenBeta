const encoder = new TextEncoder();
const decoder = new TextDecoder();
const TOKEN_SCOPE = 'sharp-eleven-beta';

export type BetaTokenPayload = {
  scope: string;
  sid: string;
  iat: number;
  exp: number;
};

export function getCorsHeaders(request: Request) {
  const origin = request.headers.get('origin') || '*';
  const allowedOrigins = (Deno.env.get('BETA_ALLOWED_ORIGINS') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const allowOrigin = allowedOrigins.length === 0 || allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-beta-token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

export function jsonResponse(request: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(request),
      'Content-Type': 'application/json',
    },
  });
}

export function handleOptions(request: Request) {
  return new Response('ok', {
    headers: getCorsHeaders(request),
  });
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function constantTimeEquals(left: string, right: string) {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const maxLength = Math.max(leftBytes.length, rightBytes.length);
  let diff = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < maxLength; index += 1) {
    diff |= (leftBytes[index] || 0) ^ (rightBytes[index] || 0);
  }

  return diff === 0;
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function importSigningKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function signValue(value: string, secret: string) {
  const key = await importSigningKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return encodeBase64Url(new Uint8Array(signature));
}

function getTokenSecret() {
  return Deno.env.get('BETA_TOKEN_SECRET') || '';
}

export async function isValidPassword(password: string) {
  const configuredHash = (Deno.env.get('BETA_ACCESS_PASSWORD_HASH') || '').trim().toLowerCase();
  const configuredPassword = Deno.env.get('BETA_ACCESS_PASSWORD') || '';

  if (configuredHash) {
    const receivedHash = await sha256Hex(password);
    return constantTimeEquals(receivedHash, configuredHash);
  }

  if (configuredPassword) {
    return constantTimeEquals(password, configuredPassword);
  }

  throw new Error('Beta password secret is not configured.');
}

export async function createBetaToken() {
  const secret = getTokenSecret();
  if (!secret) throw new Error('Beta token secret is not configured.');

  const now = Math.floor(Date.now() / 1000);
  const ttlSeconds = Number(Deno.env.get('BETA_TOKEN_TTL_SECONDS') || 60 * 60 * 24 * 14);
  const header = encodeBase64Url(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payload: BetaTokenPayload = {
    scope: TOKEN_SCOPE,
    sid: crypto.randomUUID(),
    iat: now,
    exp: now + Math.max(60, ttlSeconds),
  };
  const encodedPayload = encodeBase64Url(encoder.encode(JSON.stringify(payload)));
  const signingInput = `${header}.${encodedPayload}`;
  const signature = await signValue(signingInput, secret);

  return {
    token: `${signingInput}.${signature}`,
    payload,
  };
}

export async function verifyBetaToken(token: string): Promise<BetaTokenPayload | null> {
  const secret = getTokenSecret();
  if (!secret) throw new Error('Beta token secret is not configured.');

  const [header, payload, signature] = String(token || '').split('.');
  if (!header || !payload || !signature) return null;

  const expectedSignature = await signValue(`${header}.${payload}`, secret);
  if (!constantTimeEquals(signature, expectedSignature)) return null;

  let parsed: BetaTokenPayload;
  try {
    parsed = JSON.parse(decoder.decode(decodeBase64Url(payload))) as BetaTokenPayload;
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (parsed.scope !== TOKEN_SCOPE || !parsed.exp || parsed.exp <= now) return null;
  return parsed;
}
