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
        clientId: parsed.clientId || ''
      };
    } catch (e) {
      // fallback
    }
  }
  return { accessToken: null, expiresAt: 0, clientId: '' };
}

export function saveAuthState(state: DriveAuthState) {
  localStorage.setItem(GOOGLE_DRIVE_AUTH_KEY, JSON.stringify(state));
}

export function clearAuthState() {
  const current = getStoredAuthState();
  saveAuthState({ ...current, accessToken: null, expiresAt: 0 });
}

// Request Access Token using Google Identity Services (GIS)
export function requestDriveAuth(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!clientId) {
      reject(new Error('Please configure your Google OAuth Client ID in Settings first.'));
      return;
    }

    if (!(window as any).google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services SDK not loaded yet. Check your connection.'));
      return;
    }

    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive',
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (response.access_token) {
            const expiresAt = Date.now() + (response.expires_in || 3600) * 1000;
            saveAuthState({
              accessToken: response.access_token,
              expiresAt,
              clientId
            });
            resolve(response.access_token);
          } else {
            reject(new Error('No access token returned from Google.'));
          }
        },
        error_callback: (err: any) => {
          reject(new Error(err.message || 'OAuth error occurred'));
        }
      });
      client.requestAccessToken({ prompt: '' });
    } catch (err: any) {
      reject(err);
    }
  });
}

// Helper to check token validity and return a valid token or throw error
export async function getValidToken(): Promise<string> {
  const auth = getStoredAuthState();
  if (!auth.accessToken) {
    throw new Error('NOT_AUTHENTICATED');
  }
  
  // Buffer of 5 minutes before actual expiry
  if (Date.now() > auth.expiresAt - 5 * 60 * 1000) {
    // Token is expired or about to expire. We must re-auth.
    // In standard client-side PWA, we require user to click sync/login again
    clearAuthState();
    throw new Error('TOKEN_EXPIRED');
  }
  
  return auth.accessToken;
}

// Drive API request wrapper
async function driveFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getValidToken();
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    clearAuthState();
    throw new Error('TOKEN_EXPIRED');
  }
  return response;
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

