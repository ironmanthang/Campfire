export interface Env {
  REFRESH_TOKENS: KVNamespace;
  GOOGLE_CLIENT_SECRET: string;
}

const ALLOWED_ORIGINS = [
  'https://app-campfire.pages.dev',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
];

function getCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('Origin') || '';
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith('.app-campfire.pages.dev');

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data: unknown, status = 200, corsHeaders: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = getCorsHeaders(request);

    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === '/auth/exchange' && request.method === 'POST') {
        const body = (await request.json()) as {
          code?: string;
          code_verifier?: string;
          redirect_uri?: string;
          client_id?: string;
        };

        if (!body.code || !body.code_verifier || !body.redirect_uri || !body.client_id) {
          return jsonResponse(
            { error: 'missing_params', message: 'code, code_verifier, redirect_uri, and client_id are required' },
            400,
            corsHeaders
          );
        }

        if (!env.GOOGLE_CLIENT_SECRET) {
          return jsonResponse(
            { error: 'server_misconfigured', message: 'GOOGLE_CLIENT_SECRET is not set on worker' },
            500,
            corsHeaders
          );
        }

        // Exchange authorization code for tokens with Google
        const tokenParams = new URLSearchParams({
          client_id: body.client_id,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          code: body.code,
          code_verifier: body.code_verifier,
          grant_type: 'authorization_code',
          redirect_uri: body.redirect_uri,
        });

        const googleRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: tokenParams.toString(),
        });

        const googleData = (await googleRes.json()) as {
          access_token?: string;
          refresh_token?: string;
          expires_in?: number;
          error?: string;
          error_description?: string;
        };

        if (!googleRes.ok || !googleData.access_token) {
          return jsonResponse(
            {
              error: googleData.error || 'token_exchange_failed',
              message: googleData.error_description || 'Failed to exchange code with Google',
            },
            googleRes.status || 400,
            corsHeaders
          );
        }

        // Generate a new session handle for the PWA
        const sessionId = crypto.randomUUID();

        // Save refresh token in KV under sessionId if provided by Google
        if (googleData.refresh_token) {
          await env.REFRESH_TOKENS.put(sessionId, googleData.refresh_token);
        }

        return jsonResponse(
          {
            access_token: googleData.access_token,
            expires_in: googleData.expires_in ?? 3600,
            session_id: sessionId,
            has_refresh_token: Boolean(googleData.refresh_token),
          },
          200,
          corsHeaders
        );
      }

      if (url.pathname === '/auth/refresh' && request.method === 'POST') {
        const body = (await request.json()) as {
          session_id?: string;
          client_id?: string;
        };

        if (!body.session_id || !body.client_id) {
          return jsonResponse(
            { error: 'missing_params', message: 'session_id and client_id are required' },
            400,
            corsHeaders
          );
        }

        const refreshToken = await env.REFRESH_TOKENS.get(body.session_id);
        if (!refreshToken) {
          return jsonResponse(
            { error: 'invalid_session', message: 'Session expired or not found' },
            401,
            corsHeaders
          );
        }

        if (!env.GOOGLE_CLIENT_SECRET) {
          return jsonResponse(
            { error: 'server_misconfigured', message: 'GOOGLE_CLIENT_SECRET is not set on worker' },
            500,
            corsHeaders
          );
        }

        // Fetch fresh access token from Google using stored refresh token
        const refreshParams = new URLSearchParams({
          client_id: body.client_id,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        });

        const googleRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: refreshParams.toString(),
        });

        const googleData = (await googleRes.json()) as {
          access_token?: string;
          expires_in?: number;
          error?: string;
          error_description?: string;
        };

        if (!googleRes.ok || !googleData.access_token) {
          // If Google rejected the refresh token (e.g. user revoked access), clean up KV
          if (googleData.error === 'invalid_grant') {
            await env.REFRESH_TOKENS.delete(body.session_id);
          }
          return jsonResponse(
            {
              error: googleData.error || 'refresh_failed',
              message: googleData.error_description || 'Failed to refresh token with Google',
            },
            401,
            corsHeaders
          );
        }

        return jsonResponse(
          {
            access_token: googleData.access_token,
            expires_in: googleData.expires_in ?? 3600,
          },
          200,
          corsHeaders
        );
      }

      if (url.pathname === '/auth/revoke' && request.method === 'POST') {
        const body = (await request.json()) as {
          session_id?: string;
        };

        if (body.session_id) {
          await env.REFRESH_TOKENS.delete(body.session_id);
        }

        return jsonResponse({ success: true }, 200, corsHeaders);
      }

      return jsonResponse({ error: 'not_found', message: 'Route not found' }, 404, corsHeaders);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
      return jsonResponse({ error: 'internal_error', message: errorMsg }, 500, corsHeaders);
    }
  },
};
