import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import WebSocket = require('ws');
import { AppConfig } from 'src/common/app-config/app.config';
import {
  FileStorageUploadResult,
  IFileStorageService,
} from 'src/file-storage/interfaces/file-storage.interface';
import { extractSupabaseStoragePathFromUrl } from 'src/file-storage/utils/file-storage-url.util';
import { SupabaseStorageConfig } from './interfaces/supabase-storage.interface';

function ensureNodeWebSocket(): void {
  if (typeof globalThis.WebSocket === 'undefined') {
    globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket;
  }
}

@Injectable()
export class SupabaseStorageService implements IFileStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private supabase: SupabaseClient | null = null;
  private readonly bucket: string;

  constructor(private readonly appConfig: AppConfig) {
    const config = this.appConfig.getSupabaseStorage();
    this.bucket = config.bucket ?? '';
  }

  private validateConfig(config: Partial<SupabaseStorageConfig>): void {
    const required: (keyof SupabaseStorageConfig)[] = ['url', 'key', 'bucket'];
    const missing = required.filter(
      (key) => !String(config[key] ?? '').trim(),
    );
    if (missing.length > 0) {
      throw new InternalServerErrorException(
        `Configuração do Supabase Storage incompleta. Variáveis ausentes: ${missing.join(
          ', ',
        )}. Verifique SUPABASE_URL, SUPABASE_KEY e SUPABASE_STORAGE_BUCKET.`,
      );
    }
  }

  private getSupabaseClient(): SupabaseClient {
    const config = this.appConfig.getSupabaseStorage();
    this.validateConfig(config);

    if (!this.supabase) {
      try {
        ensureNodeWebSocket();
        this.supabase = createClient(config.url, config.key);
      } catch (error) {
        this.logger.error(
          'Falha ao inicializar cliente Supabase',
          error?.message,
        );
        throw new InternalServerErrorException(
          'Falha ao inicializar Supabase Storage. Verifique SUPABASE_URL e SUPABASE_KEY.',
        );
      }
    }

    return this.supabase;
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    subfolder?: string,
  ): Promise<FileStorageUploadResult> {
    const supabase = this.getSupabaseClient();
    const storagePath = subfolder ? `${subfolder}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from(this.bucket)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      this.logger.error(
        `Falha ao fazer upload de "${storagePath}" no Supabase Storage`,
        error.message,
      );
      throw new InternalServerErrorException(
        'Falha ao enviar arquivo para o armazenamento.',
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(this.bucket).getPublicUrl(data.path);

    return {
      fileId: data.path,
      fileName,
      webViewLink: publicUrl,
      webContentLink: publicUrl,
    };
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const supabase = this.getSupabaseClient();
      const { error } = await supabase.storage
        .from(this.bucket)
        .remove([filePath]);

      if (error) {
        this.logger.warn(
          `Falha ao deletar arquivo "${filePath}" do Supabase Storage: ${error.message}`,
        );
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.warn(
        `Erro ao deletar arquivo "${filePath}" do Supabase Storage`,
        error?.message,
      );
    }
  }

  extractFileIdFromUrl(url: string): string | null {
    return extractSupabaseStoragePathFromUrl(url);
  }
}
