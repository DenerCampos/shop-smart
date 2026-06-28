import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ResponseService } from 'src/common/response/response';
import { User } from 'src/user/entities/user.entity';
import { HealthService } from './health.service';
import { CreateHealthExamDto } from './dto/create-health-exam.dto';
import { UpdateHealthExamDto } from './dto/update-health-exam.dto';
import { HealthExamFilterDto } from './dto/health-exam-filter.dto';
import { ApproveProcessingDto } from './dto/approve-processing.dto';
import { CreateHealthPrescriptionDto } from './dto/create-health-prescription.dto';
import { HealthPrescriptionFilterDto } from './dto/health-prescription-filter.dto';
import { GenerateOverviewDto } from './dto/generate-overview.dto';
import { UpdateHealthPrescriptionDto } from './dto/update-health-prescription.dto';
import { HEALTH_MAX_FILE_BYTES } from './constants/health-processing.constants';
import {
  HealthAiOverviewResponseDto,
  HealthExamResponseDto,
  HealthPatientContextResponseDto,
  HealthPrescriptionResponseDto,
  AnalyzePrescriptionResponseDto,
  HealthProcessingResponseDto,
} from './dto/health-response.dto';

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]);

@Controller('health')
@UseGuards(AuthGuard)
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly responseService: ResponseService,
  ) {}

  // ─── Exames ──────────────────────────────────────────────────────────────

  @Post('exams')
  async createExam(
    @CurrentUser() user: User,
    @Body() dto: CreateHealthExamDto,
  ): Promise<HealthExamResponseDto> {
    const exam = await this.healthService.createExam(user, dto);
    return this.responseService.mapToDto(HealthExamResponseDto, exam);
  }

  @Get('exams')
  async listExams(
    @CurrentUser() user: User,
    @Query() filter: HealthExamFilterDto,
  ) {
    const result = await this.healthService.listExams(user, filter);
    return this.responseService.mapPaginatedToDto(
      HealthExamResponseDto,
      result,
    );
  }

  @Get('exams/:id')
  async getExam(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<HealthExamResponseDto> {
    const exam = await this.healthService.getExamById(id, user);
    return this.responseService.mapToDto(HealthExamResponseDto, exam);
  }

  @Put('exams/:id')
  async updateExam(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateHealthExamDto,
  ): Promise<HealthExamResponseDto> {
    const exam = await this.healthService.updateExam(id, user, dto);
    return this.responseService.mapToDto(HealthExamResponseDto, exam);
  }

  @Delete('exams/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExam(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.healthService.deleteExam(id, user);
  }

  // ─── Upload e Processamento ───────────────────────────────────────────────

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: memoryStorage(),
      limits: { fileSize: HEALTH_MAX_FILE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMES.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Tipo de arquivo não permitido: ${file.mimetype}. Aceitos: PDF, JPEG, PNG.`,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadFiles(
    @CurrentUser() user: User,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('targetUserId') bodyTargetUserId?: string,
    @Query('targetUserId') queryTargetUserId?: string,
  ): Promise<HealthProcessingResponseDto[]> {
    if (!files?.length) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }
    const targetUserId = bodyTargetUserId ?? queryTargetUserId;
    const result = await this.healthService.enqueueFiles(
      user,
      files,
      targetUserId,
    );
    return this.responseService.mapArrayToDto(
      HealthProcessingResponseDto,
      result,
    );
  }

  @Get('processing')
  async listProcessing(
    @CurrentUser() user: User,
  ): Promise<HealthProcessingResponseDto[]> {
    const result = await this.healthService.listProcessing(user);
    return this.responseService.mapArrayToDto(
      HealthProcessingResponseDto,
      result,
    );
  }

  @Get('processing/:id')
  async getProcessing(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<HealthProcessingResponseDto> {
    const item = await this.healthService.getProcessingById(id, user);
    return this.responseService.mapToDto(HealthProcessingResponseDto, item);
  }

  @Post('processing/:id/approve')
  async approveProcessing(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: ApproveProcessingDto,
  ): Promise<HealthExamResponseDto> {
    const exam = await this.healthService.approveProcessing(id, user, dto);
    return this.responseService.mapToDto(HealthExamResponseDto, exam);
  }

  @Delete('processing/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async discardProcessing(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.healthService.discardProcessing(id, user);
  }

  @Post('processing/:id/retry')
  async retryProcessing(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<HealthProcessingResponseDto> {
    const item = await this.healthService.retryProcessing(id, user);
    return this.responseService.mapToDto(HealthProcessingResponseDto, item);
  }

  // ─── Visão Geral de Saúde ────────────────────────────────────────────────

  @Get('patient-context')
  async listPatientContext(
    @CurrentUser() user: User,
    @Query('targetUserId') targetUserId?: string,
  ): Promise<HealthPatientContextResponseDto[]> {
    const items = await this.healthService.listPatientContext(
      user,
      targetUserId,
    );
    return this.responseService.mapArrayToDto(
      HealthPatientContextResponseDto,
      items,
    );
  }

  @Post('ai-overview')
  async generateOverview(
    @CurrentUser() user: User,
    @Body() dto: GenerateOverviewDto,
  ): Promise<HealthAiOverviewResponseDto> {
    const overview = await this.healthService.generateOverview(user, dto);
    return this.responseService.mapToDto(HealthAiOverviewResponseDto, overview);
  }

  @Get('ai-overview/latest')
  async getLatestOverview(
    @CurrentUser() user: User,
    @Query('targetUserId') targetUserId?: string,
  ): Promise<HealthAiOverviewResponseDto | null> {
    const overview = await this.healthService.getLatestOverview(
      user,
      targetUserId,
    );
    return this.responseService.mapOptionalToDto(
      HealthAiOverviewResponseDto,
      overview,
    );
  }

  // ─── Receituário ─────────────────────────────────────────────────────────

  @Post('prescriptions/analyze')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: HEALTH_MAX_FILE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMES.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Tipo de arquivo não permitido: ${file.mimetype}. Aceitos: PDF, JPEG, PNG.`,
            ),
            false,
          );
        }
      },
    }),
  )
  async analyzePrescription(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AnalyzePrescriptionResponseDto> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }
    const result = await this.healthService.analyzePrescription(user, file);
    return this.responseService.mapToDto(
      AnalyzePrescriptionResponseDto,
      result,
    );
  }

  @Post('prescriptions')
  async createPrescription(
    @CurrentUser() user: User,
    @Body() dto: CreateHealthPrescriptionDto,
  ): Promise<HealthPrescriptionResponseDto> {
    const rx = await this.healthService.createPrescription(user, dto);
    return this.responseService.mapToDto(HealthPrescriptionResponseDto, rx);
  }

  @Get('prescriptions')
  async listPrescriptions(
    @CurrentUser() user: User,
    @Query() filter: HealthPrescriptionFilterDto,
  ) {
    const result = await this.healthService.listPrescriptions(user, filter);
    return this.responseService.mapPaginatedToDto(
      HealthPrescriptionResponseDto,
      result,
    );
  }

  @Get('prescriptions/:id')
  async getPrescription(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<HealthPrescriptionResponseDto> {
    const rx = await this.healthService.getPrescriptionById(id, user);
    return this.responseService.mapToDto(HealthPrescriptionResponseDto, rx);
  }

  @Put('prescriptions/:id')
  async updatePrescription(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateHealthPrescriptionDto,
  ): Promise<HealthPrescriptionResponseDto> {
    const rx = await this.healthService.updatePrescription(id, user, dto);
    return this.responseService.mapToDto(HealthPrescriptionResponseDto, rx);
  }

  @Delete('prescriptions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePrescription(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.healthService.deletePrescription(id, user);
  }
}
