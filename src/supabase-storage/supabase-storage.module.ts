import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { SupabaseStorageService } from './supabase-storage.service';

@Module({
  imports: [CommonModule],
  providers: [SupabaseStorageService],
  exports: [SupabaseStorageService],
})
export class SupabaseStorageModule {}
