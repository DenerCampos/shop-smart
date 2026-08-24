import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { logJson } from '../common/logging/log-event.util';

/**
 * Bloqueia mutações quando o JWT foi emitido via login demo (`isDemo: true`).
 * Deve ser usado **depois** do `AuthGuard`, que propaga `request.isDemo`.
 */
@Injectable()
export class DenyDemoGuard implements CanActivate {
  private readonly logger = new Logger(DenyDemoGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      isDemo?: boolean;
      user?: { id?: string };
      method?: string;
      originalUrl?: string;
      url?: string;
    }>();

    if (request.isDemo) {
      const path =
        request.originalUrl?.split('?')[0] || request.url?.split('?')[0] || '';

      logJson(
        this.logger,
        {
          event: 'demo_profile_mutation_denied',
          userId: request.user?.id,
          method: request.method,
          path,
        },
        'warn',
      );

      throw new ForbiddenException(
        'Alterações de perfil não são permitidas na conta demo',
      );
    }

    return true;
  }
}
