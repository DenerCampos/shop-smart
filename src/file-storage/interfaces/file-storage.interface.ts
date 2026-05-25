export interface FileStorageUploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  webContentLink: string;
}

export interface IFileStorageService {
  uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    subfolder?: string,
  ): Promise<FileStorageUploadResult>;

  deleteFile(fileIdOrPath: string): Promise<void>;

  extractFileIdFromUrl(url: string): string | null;
}
