import { Module } from '@nestjs/common';
import { AppConfig } from 'src/common/app-config/app.config';
import { CommonModule } from 'src/common/common.module';
import { EMAIL_PROVIDER } from './email.constants';
import { EmailService } from './email.service';
import { IEmailProvider } from './interfaces/email-provider.interface';
import { BrevoEmailProvider } from './providers/brevo-email.provider';
import { NoopEmailProvider } from './providers/noop-email.provider';

@Module({
  imports: [CommonModule],
  providers: [
    {
      provide: EMAIL_PROVIDER,
      useFactory: (appConfig: AppConfig): IEmailProvider =>
        appConfig.getEmail().provider === 'brevo'
          ? new BrevoEmailProvider(appConfig)
          : new NoopEmailProvider(appConfig),
      inject: [AppConfig],
    },
    EmailService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
