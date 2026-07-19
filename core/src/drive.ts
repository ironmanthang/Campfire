// Google Drive adapter interface. Each platform implements this against
// its own googleDrive.ts (Tauri invoke on desktop, GIS token flow on
// mobile). The engine depends only on this interface.

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime: string;
  mimeType?: string;
  size?: string;
}

export interface DriveAdapter {
  getOrCreateFolderId(): Promise<string>;
  listDriveFiles(folderId: string): Promise<DriveFileInfo[]>;
  downloadFileContent(id: string, mimeType?: string): Promise<string>;
  // The engine only reads `modifiedTime` off the upload/update result, so
  // the adapter shape is intentionally minimal here. Platforms are free to
  // return a richer object (e.g. including `id` / `name`); the engine
  // simply ignores extra fields.
  uploadFile(folderId: string, name: string, content: string): Promise<{ modifiedTime: string }>;
  updateFileContent(id: string, content: string): Promise<{ modifiedTime: string }>;
  deleteFile(id: string): Promise<void>;
}
