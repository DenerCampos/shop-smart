import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches } from 'class-validator';

export class ExpensesIncomeComparisonDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/, { message: 'Year must be a 4-digit number' })
  @Transform(({ value }) => {
    if (!value) {
      return new Date().getFullYear().toString();
    }

    // Verifica se é um ano válido (4 dígitos)
    const yearRegex = /^\d{4}$/;
    if (!yearRegex.test(value)) {
      return new Date().getFullYear().toString();
    }

    const yearNum = parseInt(value);
    const currentYear = new Date().getFullYear();

    // Verifica se está em um range válido
    if (yearNum < 1900 || yearNum > currentYear + 10) {
      return currentYear.toString();
    }

    return value;
  })
  year?: string;
}
