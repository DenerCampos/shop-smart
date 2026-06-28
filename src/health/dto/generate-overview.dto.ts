import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateOverviewDto {
  /** ID do membro da família para o qual gerar o relatório */
  @IsOptional()
  @IsString()
  targetUserId?: string;

  /** Informações adicionais sobre o paciente (opcional; salvo no histórico) */
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  patientContext?: string;
}
