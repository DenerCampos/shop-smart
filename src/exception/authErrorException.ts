import { HttpException, HttpStatus } from '@nestjs/common';

export const AUTH_ERROR_CODES = {
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  ACCOUNT_DELETED_REACTIVATION_REQUIRED:
    'ACCOUNT_DELETED_REACTIVATION_REQUIRED',
  USER_LIMIT_REACHED: 'USER_LIMIT_REACHED',
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
