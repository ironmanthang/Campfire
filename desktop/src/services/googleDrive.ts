import { invoke } from '@tauri-apps/api/core';

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime: string;
  mimeType: string;
  size?: string;
}

// Check if we have credentials saved in the Rust backend
export async function checkIsConnected(): Promise<boolean> {
  try {
    return await invoke<boolean>('check_gdrive_connected');
  } catch {
    return false;
  }
}

// Request Access Token using Rust loopback server flow
export async function requestDriveAuth(clientId: string): Promise<string> {
  return await invoke<string>('start_gdrive_auth', { client_id: clientId });
}

export async function disconnectDrive(): Promise<void> {
  await invoke('disconnect_gdrive');
}

// Helper to get a valid token from Rust backend
export async function getValidToken(): Promise<string> {
  try {
    return await invoke<string>('get_gdrive_token');
  } catch (err: any) {
    if (err === 'NOT_AUTHENTICATED') {
      throw new Error('NOT_AUTHENTICATED');
    }
    throw new Error('TOKEN_EXPIRED');
  }
}

// Drive API request wrapper
async function driveFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getValidToken();
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    throw new Error('TOKEN_EXPIRED');
  }
  return response;
}

// Search or create CampfireJournal folder in Google Drive Root
export async function getOrCreateFolderId(): Promise<string> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.folder' and name='CampfireJournal' and trashed=false");
  const response = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`);
  const data = await response.json();
  
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  
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

// Upload new file to the folder (returns metadata including returned modifiedTime)
export async function uploadFile(folderId: string, fileName: string, content: string): Promise<{ id: string, modifiedTime: string }> {
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

// Update file content (returns metadata including updated modifiedTime)
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

