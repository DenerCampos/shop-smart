import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiQuotaException extends HttpException {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly dailyLimit: number,
    public readonly currentUsage: number,
  ) {
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message,
        error: 'API Quota Exceeded',
        provider,
        dailyLimit,
        currentUsage,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

