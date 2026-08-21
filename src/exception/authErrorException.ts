import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';

export const AUTH_ERROR_CODES = {
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  ACCOUNT_DELETED_REACTIVATION_REQUIRED:
    'ACCOUNT_DELETED_REACTIVATION_REQUIRED',
  USER_LIMIT_REACHED: 'USER_LIMIT_REACHED',
  INVALID_OR_EXPIRED_RESET_TOKEN: 'INVALID_OR_EXPIRED_RESET_TOKEN',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  LAST_FAMILY_GROUP_ADMIN: 'LAST_FAMILY_GROUP_ADMIN',
  FAMILY_GROUP_OWNER: 'FAMILY_GROUP_OWNER',
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
        message: 'Conta desativada. Recupere o acesso pelo e-mail cadastrado.',
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

export class InvalidPasswordException extends BadRequestException {
  constructor() {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      code: AUTH_ERROR_CODES.INVALID_PASSWORD,
      message: 'Senha inválida.',
    });
  }
}

export class LastFamilyGroupAdminException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        code: AUTH_ERROR_CODES.LAST_FAMILY_GROUP_ADMIN,
        message:
          'Você é o único administrador de um grupo familiar. Adicione outro administrador ou feche o grupo antes de excluir a conta.',
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class FamilyGroupOwnerCannotDeleteException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        code: AUTH_ERROR_CODES.FAMILY_GROUP_OWNER,
        message:
          'Você é o criador de um grupo familiar. Feche o grupo antes de excluir a conta.',
      },
      HttpStatus.CONFLICT,
    );
  }
}
