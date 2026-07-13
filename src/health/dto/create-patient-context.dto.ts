import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePatientContextDto {
  /** Descrição de como o paciente está se sentindo no momento */
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  /** ID do membro da família ao qual a descrição pertence (opcional) */
  @IsOptional()
  @IsString()
  targetUserId?: string;
}
