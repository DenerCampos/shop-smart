import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';

export const AUTH_ERROR_CODES = {
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  ACCOUNT_DELETED_REACTIVATION_REQUIRED:
    'ACCOUNT_DELETED_REACTIVATION_REQUIRED',
  USER_LIMIT_REACHED: 'USER_LIMIT_REACHED',
  INVALID_OR_EXPIRED_RESET_TOKEN: 'INVALID_OR_EXPIRED_RESET_TOKEN',
} as const;

export class EmailAlreadyExistsException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        code: AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS,
        message: 'E-mail já cadastrado',
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class AccountDeletedReactivationRequiredException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        code: AUTH_ERROR_CODES.ACCOUNT_DELETED_REACTIVATION_REQUIRED,
        message: 'Conta desativada. Informe a senha para reativar o acesso.',
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class UserLimitReachedException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        code: AUTH_ERROR_CODES.USER_LIMIT_REACHED,
        message: 'O limite de usuários foi atingido',
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidOrExpiredResetTokenException extends BadRequestException {
  constructor() {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      code: AUTH_ERROR_CODES.INVALID_OR_EXPIRED_RESET_TOKEN,
      message: 'Token inválido ou expirado.',
    });
  }
}
