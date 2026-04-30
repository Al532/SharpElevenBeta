import {
  handleOptions,
  jsonResponse,
  verifyBetaToken,
} from '../_shared/beta-auth.ts';

function trimLength(value: unknown, maxLength: number) {
  return String(value || '').trim().slice(0, maxLength);
}

async function insertFeedback(request: Request, data: Record<string, unknown>) {
  const supabaseUrl = (Deno.env.get('SUPABASE_URL') || '').replace(/\/+$/g, '');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Feedback storage is not configured.');
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/beta_feedback`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(detail || 'Feedback insert failed.');
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return handleOptions(request);
  if (request.method !== 'POST') return jsonResponse(request, { error: 'Method not allowed.' }, 405);

  try {
    const token = request.headers.get('x-beta-token') || '';
    const betaSession = await verifyBetaToken(token);
    if (!betaSession) return jsonResponse(request, { error: 'Beta access expired.' }, 401);

    const body = await request.json().catch(() => ({}));
    const message = trimLength(body.message, 4000);
    if (!message) return jsonResponse(request, { error: 'Feedback message is required.' }, 400);

    await insertFeedback(request, {
      message,
      page: trimLength(body.page, 160),
      app_version: trimLength(body.appVersion, 80),
      user_agent: trimLength(request.headers.get('user-agent'), 500),
      beta_session_id: betaSession.sid,
    });

    return jsonResponse(request, { ok: true });
  } catch (error) {
    return jsonResponse(request, {
      error: error instanceof Error ? error.message : 'Feedback could not be saved.',
    }, 500);
  }
});
