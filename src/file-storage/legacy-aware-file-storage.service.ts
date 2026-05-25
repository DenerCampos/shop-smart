import { Injectable } from '@nestjs/common';
import { AppConfig } from 'src/common/app-config/app.config';
import { GoogleDriveService } from 'src/google-drive/google-drive.service';
import { SupabaseStorageService } from 'src/supabase-storage/supabase-storage.service';
import {
  FileStorageUploadResult,
  IFileStorageService,
} from './interfaces/file-storage.interface';
import {
  extractGoogleDriveFileIdFromUrl,
  looksLikeGoogleDriveFileId,
} from './utils/file-storage-url.util';

/**
 * Resolve o provider ativo sob demanda e faz cleanup de URLs legadas do Google Drive
 * quando o provider principal é Supabase (sem inicializar o Drive no bootstrap).
 */
@Injectable()
export class LegacyAwareFileStorageService implements IFileStorageService {
  private primary: IFileStorageService | null = null;
  private legacyGoogleDrive: GoogleDriveService | null = null;

  constructor(private readonly appConfig: AppConfig) {}

  private getPrimary(): IFileStorageService {
    if (!this.primary) {
      this.primary =
        this.appConfig.getFileStorageProvider() === 'google-drive'
          ? new GoogleDriveService(this.appConfig)
          : new SupabaseStorageService(this.appConfig);
    }
    return this.primary;
  }

  private getLegacyGoogleDrive(): GoogleDriveService {
    if (!this.legacyGoogleDrive) {
      this.legacyGoogleDrive = new GoogleDriveService(this.appConfig);
    }
    return this.legacyGoogleDrive;
  }

  uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    subfolder?: string,
  ): Promise<FileStorageUploadResult> {
    return this.getPrimary().uploadFile(fileBuffer, fileName, mimeType, subfolder);
  }

  extractFileIdFromUrl(url: string): string | null {
    const fromPrimary = this.getPrimary().extractFileIdFromUrl(url);
    if (fromPrimary) return fromPrimary;

    if (this.appConfig.getFileStorageProvider() === 'supabase') {
      return extractGoogleDriveFileIdFromUrl(url);
    }

    return null;
  }

  async deleteFile(fileIdOrPath: string): Promise<void> {
    if (
      this.appConfig.getFileStorageProvider() === 'supabase' &&
      looksLikeGoogleDriveFileId(fileIdOrPath)
    ) {
      await this.getLegacyGoogleDrive().deleteFile(fileIdOrPath);
      return;
    }

    await this.getPrimary().deleteFile(fileIdOrPath);
  }
}
