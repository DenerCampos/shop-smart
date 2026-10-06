import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { SupabaseStorageModule } from 'src/supabase-storage/supabase-storage.module';
import { StatusController } from './status.controller';
import { SupabaseKeepaliveScheduler } from './supabase-keepalive.scheduler';

@Module({
  imports: [CommonModule, SupabaseStorageModule],
  controllers: [StatusController],
  providers: [SupabaseKeepaliveScheduler],
})
export class StatusModule {}
