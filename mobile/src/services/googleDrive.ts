// Google Drive API REST integration

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime: string;
  mimeType: string;
  size?: string;
}

export interface DriveAuthState {
  accessToken: string | null;
  expiresAt: number; // timestamp
  sessionId: string | null; // Cloudflare Worker session ID
  clientId: string;
}

// Key for storage
const GOOGLE_DRIVE_AUTH_KEY = 'past_you_drive_auth';

export function getStoredAuthState(): DriveAuthState {
  const stored = localStorage.getItem(GOOGLE_DRIVE_AUTH_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return {
        accessToken: parsed.accessToken || null,
        expiresAt: parsed.expiresAt || 0,
        sessionId: parsed.sessionId || null,
        clientId: parsed.clientId || '',
      };
    } catch {
      // fallback
    }
  }
  return { accessToken: null, expiresAt: 0, sessionId: null, clientId: '' };
}

export function saveAuthState(state: DriveAuthState) {
  localStorage.setItem(GOOGLE_DRIVE_AUTH_KEY, JSON.stringify(state));
}

export function clearAuthState() {
  const current = getStoredAuthState();
  if (current.sessionId) {
    const workerUrl = import.meta.env.VITE_WORKER_AUTH_URL || 'https://campfire-auth.your-subdomain.workers.dev';
    fetch(`${workerUrl.replace(/\/$/, '')}/auth/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: current.sessionId }),
    }).catch(() => {});
  }
  localStorage.removeItem(GOOGLE_DRIVE_AUTH_KEY);
}

// Helper to generate PKCE verifier and challenge
async function generatePkce(): Promise<{ verifier: string; challenge: string }> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');

  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);

  const base64Digest = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return { verifier, challenge: base64Digest };
}

// Initiate PKCE authorization flow (redirects user to Google OAuth)
export async function startAuthFlow(clientId?: string): Promise<void> {
  const targetClientId = clientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  if (!targetClientId) {
    throw new Error('Please configure your Google OAuth Client ID first.');
  }

  const { verifier, challenge } = await generatePkce();
  sessionStorage.setItem('oauth_code_verifier', verifier);

  const redirectUri = window.location.origin + window.location.pathname;
  const params = new URLSearchParams({
    client_id: targetClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive.file',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Handle Google redirect back to PWA with code
export async function handleAuthCallback(): Promise<boolean> {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  if (!code) return false;

  const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
  sessionStorage.removeItem('oauth_code_verifier');

  if (!codeVerifier) {
    console.error('OAuth code verifier missing from session storage.');
    return false;
  }

  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, cleanUrl);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const workerUrl = import.meta.env.VITE_WORKER_AUTH_URL || 'https://campfire-auth.your-subdomain.workers.dev';

  const res = await fetch(`${workerUrl.replace(/\/$/, '')}/auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      code_verifier: codeVerifier,
      redirect_uri: cleanUrl,
      client_id: clientId,
    }),
  });

  if (!res.ok) {
    const errData = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(errData.message || 'Failed to exchange authorization code');
  }

  const data = (await res.json()) as { access_token: string; expires_in?: number; session_id?: string };
  const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  saveAuthState({
    accessToken: data.access_token,
    expiresAt,
    sessionId: data.session_id || null,
    clientId,
  });

  return true;
}

// Refresh access token via Cloudflare Worker
export async function refreshAccessToken(): Promise<string> {
  const auth = getStoredAuthState();
  if (!auth.sessionId) {
    throw new Error('NOT_AUTHENTICATED');
  }

  const clientId = auth.clientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const workerUrl = import.meta.env.VITE_WORKER_AUTH_URL || 'https://campfire-auth.your-subdomain.workers.dev';

  const res = await fetch(`${workerUrl.replace(/\/$/, '')}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: auth.sessionId,
      client_id: clientId,
    }),
  });

  if (!res.ok) {
    clearAuthState();
    throw new Error('TOKEN_EXPIRED');
  }

  const data = (await res.json()) as { access_token: string; expires_in?: number };
  const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  saveAuthState({
    ...auth,
    accessToken: data.access_token,
    expiresAt,
  });

  return data.access_token;
}

// 50 minutes threshold (token lasts 60m; trigger refresh after 50m / 10m buffer before expiry)
const REFRESH_BUFFER_MS = 10 * 60 * 1000;

// Helper to check token validity and return a valid token or perform worker token refresh
export async function getValidToken(): Promise<string> {
  const auth = getStoredAuthState();
  if (!auth.accessToken && !auth.sessionId) {
    throw new Error('NOT_AUTHENTICATED');
  }

  // Refresh if missing token or within 10 minutes of expiry
  if (!auth.accessToken || Date.now() >= auth.expiresAt - REFRESH_BUFFER_MS) {
    if (auth.sessionId) {
      try {
        return await refreshAccessToken();
      } catch {
        clearAuthState();
        throw new Error('TOKEN_EXPIRED');
      }
    } else if (Date.now() >= auth.expiresAt) {
      clearAuthState();
      throw new Error('TOKEN_EXPIRED');
    }
  }

  return auth.accessToken!;
}

// Drive API request wrapper
async function driveFetch(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const token = await getValidToken();

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    // If 401 Unauthorized occurs, attempt one token refresh recovery
    if (response.status === 401) {
      const auth = getStoredAuthState();
      if (auth.sessionId) {
        try {
          const newToken = await refreshAccessToken();
          headers.set('Authorization', `Bearer ${newToken}`);

          const retryController = new AbortController();
          const retryTimeoutId = setTimeout(() => retryController.abort(), timeoutMs);

          response = await fetch(url, {
            ...options,
            headers,
            signal: options.signal || retryController.signal,
          });
          clearTimeout(retryTimeoutId);
          if (response.ok) {
            return response;
          }
        } catch {
          // Fallthrough to clear state
        }
      }
      clearAuthState();
      throw new Error('TOKEN_EXPIRED');
    }
    return response;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('NETWORK_TIMEOUT');
    }
    throw err;
  }
}


// Search or create CampfireJournal folder in Google Drive Root
export async function getOrCreateFolderId(): Promise<string> {
  // 1. Search for existing folder
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.folder' and name='CampfireJournal' and trashed=false");
  const response = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`);
  const data = await response.json();
  
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  
  // 2. Create the folder if not exists
  const createResponse = await driveFetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'CampfireJournal',
      mimeType: 'application/vnd.google-apps.folder'
    })
  });
  
  const created = await createResponse.json();
  if (!created.id) {
    throw new Error('Failed to create CampfireJournal folder in Google Drive.');
  }
  return created.id;
}

// List all .md journal files inside the folder
export async function listDriveFiles(folderId: string): Promise<DriveFileInfo[]> {
  const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const response = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,mimeType,size)&pageSize=1000`);
  const data = await response.json();
  const files: DriveFileInfo[] = data.files || [];
  return files.filter(f => f.name.endsWith('.md'));
}

export async function exportGoogleDocAsText(fileId: string): Promise<string> {
  const response = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`
  );
  if (!response.ok) {
    throw new Error(`Failed to export Google Doc as text (status ${response.status}).`);
  }
  return await response.text();
}

// Download markdown file content
export async function downloadFileContent(fileId: string, mimeType?: string): Promise<string> {
  const isGoogleDoc = mimeType?.startsWith('application/vnd.google-apps.');
  if (isGoogleDoc) {
    return await exportGoogleDocAsText(fileId);
  }
  const response = await driveFetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
  if (!response.ok) {
    throw new Error(`Failed to download file (status ${response.status}). If this file was created by another client, ensure both Client IDs are configured under the SAME Google Cloud Project.`);
  }
  return await response.text();
}

// Upload new file to the folder
export async function uploadFile(folderId: string, fileName: string, content: string): Promise<{ id: string; modifiedTime: string }> {
  // Multipart upload combining metadata and media content
  const boundary = '314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--\r\n`;
  
  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: 'text/markdown'
  };
  
  const multipartBody = 
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/markdown; charset=UTF-8\r\n\r\n' +
    content +
    closeDelimiter;
    
  const response = await driveFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime', {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartBody
  });
  
  const data = await response.json();
  if (!data.id) {
    throw new Error(`Failed to upload ${fileName} to Google Drive.`);
  }
  return { id: data.id, modifiedTime: data.modifiedTime };
}

// Update file content
export async function updateFileContent(fileId: string, content: string): Promise<{ modifiedTime: string }> {
  const response = await driveFetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&fields=modifiedTime`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'text/markdown'
    },
    body: content
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update file ${fileId} on Google Drive.`);
  }
  const data = await response.json();
  return { modifiedTime: data.modifiedTime };
}

// Delete file from Google Drive
export async function deleteFile(fileId: string): Promise<void> {
  const response = await driveFetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE'
  });
  
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete file ${fileId} from Google Drive.`);
  }
}

// Get authenticated user info
export async function getGoogleUserInfo(): Promise<{ emailAddress: string; displayName: string } | null> {
  try {
    const response = await driveFetch('https://www.googleapis.com/drive/v3/about?fields=user');
    if (response.ok) {
      const data = await response.json();
      return data.user || null;
    }
  } catch (err) {
    console.error('Failed to fetch Google user info:', err);
  }
  return null;
}


