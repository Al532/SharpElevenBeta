import {
  createBetaToken,
  handleOptions,
  jsonResponse,
  validateBetaPassword,
} from '../_shared/beta-auth.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return handleOptions(request);
  if (request.method !== 'POST') return jsonResponse(request, { error: 'Method not allowed.' }, 405);

  try {
    const body = await request.json().catch(() => ({}));
    const password = typeof body.password === 'string' ? body.password : '';
    const passwordMatch = password ? await validateBetaPassword(password) : { ok: false };

    if (!passwordMatch.ok) {
      return jsonResponse(request, { error: 'Wrong password.' }, 401);
    }

    const { token, payload } = await createBetaToken(passwordMatch.accessKeyId);
    return jsonResponse(request, {
      token,
      expiresAt: new Date(payload.exp * 1000).toISOString(),
    });
  } catch (error) {
    return jsonResponse(request, {
      error: error instanceof Error ? error.message : 'Beta login failed.',
    }, 500);
  }
});
