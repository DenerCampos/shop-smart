import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { FamilyMemberResolverService } from 'src/common/family-member-resolver/family-member-resolver.service';
import { Pagination } from 'src/common/pagination/pagination';
import { AppConfig } from 'src/common/app-config/app.config';
import { FILE_STORAGE } from 'src/file-storage/file-storage.constants';
import { IFileStorageService } from 'src/file-storage/interfaces/file-storage.interface';
import { TextRecognitionService } from 'src/text-recognition/textRecognition.service';
import { ImageRecognitionService } from 'src/image-recognition/imageRecognition.service';
import { HealthExam } from './entities/health-exam.entity';
import { HealthExamProcessing } from './entities/health-exam-processing.entity';
import { HealthPrescription } from './entities/health-prescription.entity';
import { HealthAiOverview } from './entities/health-ai-overview.entity';
import { HealthPatientContext } from './entities/health-patient-context.entity';
import {
  HealthExamItemEvolutionPoint,
  IHealthExamRepository,
} from './interfaces/health-exam.repository.interface';
import { IHealthProcessingRepository } from './interfaces/health-processing.repository.interface';
import { IHealthPrescriptionRepository } from './interfaces/health-prescription.repository.interface';
import { IHealthOverviewRepository } from './interfaces/health-overview.repository.interface';
import { IHealthMemberRepository } from './interfaces/health-member.repository.interface';
import { IHealthPatientContextRepository } from './interfaces/health-patient-context.repository.interface';
import type { CreateHealthExamDto } from './dto/create-health-exam.dto';
import type { UpdateHealthExamDto } from './dto/update-health-exam.dto';
import type { HealthExamFilterDto } from './dto/health-exam-filter.dto';
import type { HealthExamItemNamesQueryDto } from './dto/health-exam-item-names.query.dto';
import type { HealthExamEvolutionQueryDto } from './dto/health-exam-evolution.query.dto';
import { formatLabItemDisplayName } from './utils/format-lab-item-name';
import type { ApproveProcessingDto } from './dto/approve-processing.dto';
import type { CreateHealthPrescriptionDto } from './dto/create-health-prescription.dto';
import type { UpdateHealthPrescriptionDto } from './dto/update-health-prescription.dto';
import type { HealthPrescriptionFilterDto } from './dto/health-prescription-filter.dto';
import type { GenerateOverviewDto } from './dto/generate-overview.dto';
import type { CreatePatientContextDto } from './dto/create-patient-context.dto';
import type { HealthOverviewFilterDto } from './dto/health-overview-filter.dto';
import type {
  ExtractedExamData,
  ExtractedExamItem,
  ExtractedPrescriptionData,
  HealthExamType,
  HealthFileType,
} from './types/health.types';
import { FAMILY_GROUP_ROLES } from 'src/family-group/types/family-group-role.type';
import { parsePdfText } from 'src/common/pdf/pdf-parser.util';
import { downloadUrlToBuffer } from 'src/common/http/download-url.util';
import {
  HEALTH_MAX_FILE_BYTES,
  HEALTH_PROCESSING_AUTO_RETRY_AFTER_MS,
  HEALTH_PROCESSING_BATCH_SIZE,
} from './constants/health-processing.constants';

const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class HealthService {
  constructor(
    @Inject('IHealthExamRepository')
    private readonly examRepo: IHealthExamRepository,
    @Inject('IHealthProcessingRepository')
    private readonly processingRepo: IHealthProcessingRepository,
    @Inject('IHealthPrescriptionRepository')
    private readonly prescriptionRepo: IHealthPrescriptionRepository,
    @Inject('IHealthOverviewRepository')
    private readonly overviewRepo: IHealthOverviewRepository,
    @Inject('IHealthMemberRepository')
    private readonly memberRepo: IHealthMemberRepository,
    @Inject('IHealthPatientContextRepository')
    private readonly patientContextRepo: IHealthPatientContextRepository,
    private readonly familyMemberResolver: FamilyMemberResolverService,
    private readonly pagination: Pagination,
    private readonly appConfig: AppConfig,
    private readonly textRecognitionService: TextRecognitionService,
    private readonly imageRecognitionService: ImageRecognitionService,
    @Inject(FILE_STORAGE)
    private readonly fileStorage: IFileStorageService,
  ) {}

  // ─── Exames ──────────────────────────────────────────────────────────────

  async createExam(user: User, dto: CreateHealthExamDto): Promise<HealthExam> {
    const { groupId, isAdmin } = await this.familyMemberResolver.resolve(
      user.id,
    );

    const targetUserId = await this.resolveTargetUserId(
      dto.targetUserId,
      user.id,
      isAdmin,
      groupId,
    );

    return this.examRepo.createExam(
      {
        labName: dto.labName ?? null,
        doctorName: dto.doctorName ?? null,
        examDate: dto.examDate ?? null,
        examType: dto.examType,
        sourceType: 'MANUAL',
        status: 'APPROVED',
        notes: dto.notes ?? null,
        familyGroup: groupId ? ({ id: groupId } as any) : null,
        user: { id: targetUserId } as any,
        createdBy: { id: user.id } as any,
      },
      (dto.items ?? []).map((i) => ({ ...i })),
    );
  }

  async listExams(user: User, filter: HealthExamFilterDto) {
    const { groupId, isAdmin } = await this.familyMemberResolver.resolve(
      user.id,
    );

    if (filter.userId && filter.userId !== user.id) {
      await this.assertCanView(filter.userId, user.id);
    }

    const { data, total, page, limit } = await this.examRepo.findAll(
      filter,
      groupId,
      isAdmin,
      user.id,
    );

    const baseUrl = `${this.appConfig.getBaseUrl()}/health/exams`;
    return this.pagination.paginateData(data, page, limit, total, baseUrl);
  }

  async getExamById(id: string, user: User): Promise<HealthExam> {
    const exam = await this.examRepo.findById(id);
    if (!exam) throw new NotFoundException('Exame não encontrado');
    await this.assertCanView(exam.user.id, user.id);
    return exam;
  }

  async listLabItemNames(
    user: User,
    dto: HealthExamItemNamesQueryDto,
  ): Promise<string[]> {
    const targetUserId = dto.userId ?? user.id;
    if (dto.userId && dto.userId !== user.id) {
      await this.assertCanView(dto.userId, user.id);
    }
    const names = await this.examRepo.findDistinctLabItemNames(
      targetUserId,
      dto.search,
    );

    const formatted = names.map(formatLabItemDisplayName);
    return [...new Set(formatted)].sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
    );
  }

  async getLabItemEvolution(
    user: User,
    dto: HealthExamEvolutionQueryDto,
  ): Promise<HealthExamItemEvolutionPoint[]> {
    const targetUserId = dto.userId ?? user.id;
    if (dto.userId && dto.userId !== user.id) {
      await this.assertCanView(dto.userId, user.id);
    }
    return this.examRepo.findLabItemEvolution(
      targetUserId,
      dto.itemName,
      dto.dateFrom,
      dto.dateTo,
    );
  }

  async updateExam(
    id: string,
    user: User,
    dto: UpdateHealthExamDto,
  ): Promise<HealthExam> {
    const exam = await this.getExamById(id, user);
    await this.assertCanWrite(exam.user.id, user.id);

    Object.assign(exam, {
      labName: dto.labName ?? exam.labName,
      doctorName: dto.doctorName ?? exam.doctorName,
      examDate: dto.examDate ?? exam.examDate,
      examType: dto.examType ?? exam.examType,
      notes: dto.notes ?? exam.notes,
    });

    await this.examRepo.saveExam(exam);

    if (dto.items !== undefined) {
      await this.examRepo.replaceItems(id, dto.items);
    }

    return this.getExamById(id, user);
  }

  async deleteExam(id: string, user: User): Promise<void> {
    const exam = await this.getExamById(id, user);
    await this.assertCanWrite(exam.user.id, user.id);
    await this.examRepo.softDelete(id);

    for (const file of exam.files ?? []) {
      const fileId = this.fileStorage.extractFileIdFromUrl(file.fileUrl);
      if (fileId) {
        await this.fileStorage.deleteFile(fileId).catch(() => null);
      }
    }
  }

  // ─── Upload e Processamento ───────────────────────────────────────────────

  async enqueueFiles(
    user: User,
    files: Express.Multer.File[],
    targetUserId?: string,
  ): Promise<HealthExamProcessing[]> {
    const { groupId, isAdmin } = await this.familyMemberResolver.resolve(
      user.id,
    );
    const resolvedTargetId = await this.resolveTargetUserId(
      targetUserId,
      user.id,
      isAdmin,
      groupId,
    );

    const results: HealthExamProcessing[] = [];

    for (const file of files) {
      const mimeType = file.mimetype;
      const fileType: HealthFileType =
        mimeType === 'application/pdf' ? 'PDF' : 'IMAGE';
      const ext = MIME_TO_EXT[mimeType] ?? 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const uploaded = await this.fileStorage.uploadFile(
        file.buffer,
        fileName,
        mimeType,
        'health',
      );

      const processing = await this.processingRepo.create({
        fileUrl: uploaded.webViewLink,
        fileType,
        originalFilename: file.originalname,
        status: 'QUEUED',
        currentPage: 0,
        totalPages: 0,
        familyGroup: groupId ? ({ id: groupId } as any) : null,
        uploadedBy: { id: user.id } as any,
        targetUser: { id: resolvedTargetId } as any,
      });

      results.push(processing);
    }

    return results;
  }

  async listProcessing(user: User): Promise<HealthExamProcessing[]> {
    const { groupId, isAdmin } = await this.familyMemberResolver.resolve(
      user.id,
    );
    return this.processingRepo.findForUser(user.id, groupId, isAdmin);
  }

  async getProcessingById(
    id: string,
    user: User,
  ): Promise<HealthExamProcessing> {
    const item = await this.processingRepo.findById(id);
    if (!item) throw new NotFoundException('Processamento não encontrado');
    await this.assertCanView(this.resolveProcessingOwnerId(item), user.id);
    return item;
  }

  async approveProcessing(
    id: string,
    user: User,
    dto: ApproveProcessingDto,
  ): Promise<HealthExam> {
    const processing = await this.getProcessingById(id, user);
    await this.assertCanWrite(
      this.resolveProcessingOwnerId(processing),
      user.id,
    );

    if (processing.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Somente processamentos concluídos podem ser aprovados.',
      );
    }

    const extracted = processing.extractedData;
    const labName = dto.labName ?? extracted?.labName ?? null;
    const doctorName = dto.doctorName ?? extracted?.doctorName ?? null;
    const examDate = dto.examDate ?? extracted?.examDate ?? null;
    const examType = dto.examType ?? extracted?.examType ?? 'OTHER';
    const items = dto.items ?? extracted?.items ?? [];

    const savedExam = await this.examRepo.createExam(
      {
        labName,
        doctorName,
        examDate,
        examType,
        sourceType: processing.fileType === 'PDF' ? 'PDF' : 'IMAGE_FILE',
        status: 'APPROVED',
        notes: dto.notes ?? null,
        familyGroup: processing.familyGroup
          ? ({ id: processing.familyGroup.id } as any)
          : null,
        user: { id: processing.targetUser.id } as any,
        createdBy: { id: user.id } as any,
      },
      items.map((i) => ({
        itemName: i.itemName,
        material: i.material ?? null,
        method: i.method ?? null,
        resultValue: i.resultValue ?? null,
        resultUnit: i.resultUnit ?? null,
        referenceRange: i.referenceRange ?? null,
        isAbnormal: i.isAbnormal ?? false,
        itemNotes: i.itemNotes ?? null,
        findings: i.findings ?? null,
        conclusion: i.conclusion ?? null,
      })),
    );

    await this.examRepo.attachFiles(savedExam.id, [
      {
        fileUrl: processing.fileUrl,
        fileType: processing.fileType,
        originalFilename: processing.originalFilename,
        pageCount: processing.totalPages ?? null,
      },
    ]);

    await this.processingRepo.deleteById(id);

    return (await this.examRepo.findById(savedExam.id)) as HealthExam;
  }

  async discardProcessing(id: string, user: User): Promise<void> {
    const processing = await this.getProcessingById(id, user);
    await this.assertCanWrite(
      this.resolveProcessingOwnerId(processing),
      user.id,
    );

    const fileId = this.fileStorage.extractFileIdFromUrl(processing.fileUrl);
    if (fileId) {
      await this.fileStorage.deleteFile(fileId).catch(() => null);
    }

    await this.processingRepo.deleteById(id);
  }

  async retryProcessing(id: string, user: User): Promise<HealthExamProcessing> {
    const processing = await this.getProcessingById(id, user);
    await this.assertCanWrite(
      this.resolveProcessingOwnerId(processing),
      user.id,
    );

    if (processing.status !== 'FAILED') {
      throw new BadRequestException(
        'Somente arquivos com falha podem ser reprocessados.',
      );
    }

    await this.processingRepo.updateStatus(id, 'QUEUED', {
      errorMessage: null,
      failedAt: null,
    });

    return (await this.processingRepo.findById(id)) as HealthExamProcessing;
  }

  // ─── Receituário ─────────────────────────────────────────────────────────

  async analyzePrescription(
    user: User,
    file: Express.Multer.File,
  ): Promise<ExtractedPrescriptionData> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Arquivo vazio.');
    }

    const mimeType = file.mimetype;

    if (mimeType === 'application/pdf') {
      const pdfText = await parsePdfText(file.buffer);
      if (pdfText?.trim().length > 100) {
        return this.textRecognitionService.analyzePrescription(pdfText, user);
      }
      const base64 = file.buffer.toString('base64');
      return this.imageRecognitionService.analyzePrescriptionImage(
        base64,
        'application/pdf',
        user,
      );
    }

    const base64 = file.buffer.toString('base64');
    const imageMime = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
    return this.imageRecognitionService.analyzePrescriptionImage(
      base64,
      imageMime,
      user,
    );
  }

  async createPrescription(
    user: User,
    dto: CreateHealthPrescriptionDto,
  ): Promise<HealthPrescription> {
    const { groupId, isAdmin } = await this.familyMemberResolver.resolve(
      user.id,
    );
    const targetUserId = await this.resolveTargetUserId(
      dto.targetUserId,
      user.id,
      isAdmin,
      groupId,
    );

    return this.prescriptionRepo.create(
      {
        doctorName: dto.doctorName,
        prescriptionDate: dto.prescriptionDate,
        notes: dto.notes ?? null,
        familyGroup: groupId ? ({ id: groupId } as any) : null,
        user: { id: targetUserId } as any,
        createdBy: { id: user.id } as any,
      },
      (dto.items ?? []).map((i) => ({
        ...i,
        daysOfWeek: i.daysOfWeek ?? null,
        endDate: i.endDate ?? null,
      })),
    );
  }

  async listPrescriptions(user: User, filter: HealthPrescriptionFilterDto) {
    const { groupId } = await this.familyMemberResolver.resolve(user.id);

    if (filter.userId && filter.userId !== user.id) {
      await this.assertCanView(filter.userId, user.id);
    }

    const { data, total, page, limit } = await this.prescriptionRepo.findAll(
      filter,
      groupId,
      user.id,
    );

    const baseUrl = `${this.appConfig.getBaseUrl()}/health/prescriptions`;
    return this.pagination.paginateData(data, page, limit, total, baseUrl);
  }

  async getPrescriptionById(
    id: string,
    user: User,
  ): Promise<HealthPrescription> {
    const rx = await this.prescriptionRepo.findById(id);
    if (!rx) throw new NotFoundException('Receituário não encontrado');
    await this.assertCanView(rx.user.id, user.id);
    return rx;
  }

  async updatePrescription(
    id: string,
    user: User,
    dto: UpdateHealthPrescriptionDto,
  ): Promise<HealthPrescription> {
    const rx = await this.getPrescriptionById(id, user);
    await this.assertCanWrite(rx.user.id, user.id);

    Object.assign(rx, {
      doctorName: dto.doctorName ?? rx.doctorName,
      prescriptionDate: dto.prescriptionDate ?? rx.prescriptionDate,
      notes: dto.notes ?? rx.notes,
    });
    await this.prescriptionRepo.save(rx);

    if (dto.items !== undefined) {
      await this.prescriptionRepo.replaceItems(
        id,
        dto.items.map((i) => ({
          ...i,
          daysOfWeek: i.daysOfWeek ?? null,
          endDate: i.endDate ?? null,
        })),
      );
    }

    return this.getPrescriptionById(id, user);
  }

  async deletePrescription(id: string, user: User): Promise<void> {
    const rx = await this.getPrescriptionById(id, user);
    await this.assertCanWrite(rx.user.id, user.id);
    await this.prescriptionRepo.softDelete(id);
  }

  // ─── Visão Geral de Saúde ────────────────────────────────────────────────

  async listPatientContext(
    user: User,
    targetUserId?: string,
  ): Promise<HealthPatientContext[]> {
    const { groupId } = await this.familyMemberResolver.resolve(user.id);
    const resolvedTargetId = targetUserId ?? user.id;

    if (targetUserId && targetUserId !== user.id) {
      await this.assertCanView(targetUserId, user.id);
    }

    return this.patientContextRepo.findByUserId(resolvedTargetId, groupId);
  }

  async getLatestPatientContext(
    user: User,
    targetUserId?: string,
  ): Promise<HealthPatientContext | null> {
    const contexts = await this.listPatientContext(user, targetUserId);
    return contexts[0] ?? null;
  }

  async createPatientContext(
    user: User,
    dto: CreatePatientContextDto,
  ): Promise<HealthPatientContext> {
    const { groupId, isAdmin } = await this.familyMemberResolver.resolve(
      user.id,
    );
    const targetUserId = await this.resolveTargetUserId(
      dto.targetUserId,
      user.id,
      isAdmin,
      groupId,
    );

    const content = dto.content?.trim() ?? '';
    if (!content) {
      throw new BadRequestException('Informe a descrição do paciente.');
    }

    return this.patientContextRepo.create({
      content,
      familyGroup: groupId ? ({ id: groupId } as any) : null,
      user: { id: targetUserId } as any,
      createdBy: { id: user.id } as any,
    });
  }

  async generateOverview(
    user: User,
    dto: GenerateOverviewDto,
  ): Promise<HealthAiOverview> {
    const { groupId, isAdmin } = await this.familyMemberResolver.resolve(
      user.id,
    );
    const targetUserId = await this.resolveTargetUserId(
      dto.targetUserId,
      user.id,
      isAdmin,
      groupId,
    );

    const trimmedContext = dto.patientContext?.trim() ?? '';
    const latestOverview = await this.overviewRepo.findLatest(
      targetUserId,
      groupId,
    );

    // Texto novo digitado no request é salvo antes de decidir o que enviar,
    // assim ele já entra como "contexto novo" desde o último relatório.
    if (trimmedContext) {
      await this.patientContextRepo.create({
        content: trimmedContext,
        familyGroup: groupId ? ({ id: groupId } as any) : null,
        user: { id: targetUserId } as any,
        createdBy: { id: user.id } as any,
      });
    }

    const latestPrescription = await this.prescriptionRepo.findLatestByUserId(
      targetUserId,
      groupId,
    );

    const isFirstReport = !latestOverview;
    // Usa `createdAt` (gerado por CURRENT_TIMESTAMP no banco) como marco, e não
    // `generatedAt` (setado via `new Date()` no Node): assim a comparação fica no
    // mesmo fuso dos `createdAt`/`updatedAt` de exames, contextos e receituários.
    const since = latestOverview?.createdAt ?? null;

    // 1º relatório → envia tudo. 2º em diante → apenas o que é novo desde a
    // data do último relatório.
    const exams =
      isFirstReport || !since
        ? await this.examRepo.findApprovedByUserId(targetUserId)
        : await this.examRepo.findApprovedByUserIdChangedAfter(
            targetUserId,
            since,
          );

    const contextHistory =
      isFirstReport || !since
        ? await this.patientContextRepo.findByUserId(targetUserId, groupId)
        : await this.patientContextRepo.findByUserIdCreatedAfter(
            targetUserId,
            groupId,
            since,
          );

    const prescriptionIsNew =
      !!latestPrescription &&
      !!since &&
      (new Date(latestPrescription.createdAt) > since ||
        new Date(latestPrescription.updatedAt) > since);

    if (!isFirstReport && since) {
      const hasNewData =
        exams.length > 0 || contextHistory.length > 0 || prescriptionIsNew;

      // Sem exames, contextos ou receituários novos → não gera; devolve o último.
      if (!hasNewData) {
        return latestOverview as HealthAiOverview;
      }
    } else {
      // Primeiro relatório: precisa de ao menos um dado para gerar.
      const hasAnyData =
        exams.length > 0 || contextHistory.length > 0 || !!latestPrescription;
      if (!hasAnyData) {
        throw new BadRequestException(
          'Cadastre exames ou informe o contexto do paciente para gerar o primeiro relatório.',
        );
      }
    }

    const previousReportSection = this.buildPreviousReportSection(
      isFirstReport ? null : latestOverview,
    );
    const patientSection = this.buildPatientContextSection(contextHistory);
    const examsLabel = isFirstReport
      ? 'DADOS DOS EXAMES:'
      : 'NOVOS EXAMES DESDE O ÚLTIMO RELATÓRIO:';
    const examsSection = exams.length
      ? this.buildExamsContext(exams)
      : isFirstReport
        ? 'Nenhum exame cadastrado.'
        : 'Nenhum exame novo desde o último relatório.';
    const prescriptionSection =
      this.buildPrescriptionSection(latestPrescription);

    const fullContext = [
      previousReportSection,
      patientSection,
      `${examsLabel}\n${examsSection}`,
      prescriptionSection,
    ]
      .filter(Boolean)
      .join('\n\n---\n\n');

    const reportContent =
      await this.textRecognitionService.generateHealthOverview(
        fullContext,
        user,
      );

    return this.overviewRepo.save({
      reportContent,
      generatedAt: new Date(),
      familyGroup: groupId ? ({ id: groupId } as any) : null,
      user: { id: targetUserId } as any,
      generatedBy: { id: user.id } as any,
    });
  }

  async getLatestOverview(
    user: User,
    targetUserId?: string,
  ): Promise<HealthAiOverview | null> {
    const { groupId } = await this.familyMemberResolver.resolve(user.id);
    const resolvedTargetId = targetUserId ?? user.id;

    if (targetUserId && targetUserId !== user.id) {
      await this.assertCanView(targetUserId, user.id);
    }

    return this.overviewRepo.findLatest(resolvedTargetId, groupId);
  }

  async listOverviews(
    user: User,
    filter: HealthOverviewFilterDto,
  ): Promise<HealthAiOverview[]> {
    const { groupId } = await this.familyMemberResolver.resolve(user.id);

    let userIds: string[];
    if (filter.targetUserId) {
      if (filter.targetUserId !== user.id) {
        await this.assertCanView(filter.targetUserId, user.id);
      }
      userIds = [filter.targetUserId];
    } else {
      userIds = await this.familyMemberResolver.getAcceptedMemberUserIds(
        user.id,
      );
    }

    const startDate = filter.startDate
      ? `${filter.startDate.slice(0, 10)} 00:00:00`
      : undefined;
    const endDate = filter.endDate
      ? `${filter.endDate.slice(0, 10)} 23:59:59`
      : undefined;

    return this.overviewRepo.findByFilters(
      userIds,
      groupId,
      startDate,
      endDate,
    );
  }

  async getOverviewById(id: string, user: User): Promise<HealthAiOverview> {
    const overview = await this.overviewRepo.findById(id);
    if (!overview) {
      throw new NotFoundException('Relatório não encontrado');
    }
    await this.assertCanView(overview.user.id, user.id);
    return overview;
  }

  // ─── Processamento interno (chamado pelo Scheduler) ───────────────────────

  async processNextQueued(): Promise<void> {
    const queued = await this.processingRepo.findQueued(
      HEALTH_PROCESSING_BATCH_SIZE,
    );
    const remaining = HEALTH_PROCESSING_BATCH_SIZE - queued.length;
    const retryItems =
      remaining > 0
        ? await this.processingRepo.findFailedReadyForAutoRetry(
            remaining,
            HEALTH_PROCESSING_AUTO_RETRY_AFTER_MS,
          )
        : [];

    for (const item of [...queued, ...retryItems]) {
      if (item.status === 'FAILED') {
        await this.processingRepo.updateStatus(item.id, 'QUEUED', {
          errorMessage: null,
          failedAt: null,
        });
        const reloaded = await this.processingRepo.findById(item.id);
        if (reloaded) {
          await this.runProcessingItem(reloaded);
        }
        continue;
      }

      await this.runProcessingItem(item);
    }
  }

  private async runProcessingItem(
    item: HealthExamProcessing,
  ): Promise<HealthExamProcessing> {
    await this.processingRepo.updateStatus(item.id, 'PROCESSING', {
      errorMessage: null,
    });

    try {
      const extracted = await this.processFile(item);
      await this.processingRepo.updateStatus(item.id, 'COMPLETED', {
        extractedData: extracted,
        errorMessage: null,
        failedAt: null,
      });
    } catch (err) {
      await this.processingRepo.updateStatus(item.id, 'FAILED', {
        errorMessage: err instanceof Error ? err.message : String(err),
        failedAt: new Date(),
        retryCount: (item.retryCount ?? 0) + 1,
      });
    }

    return (await this.processingRepo.findById(
      item.id,
    )) as HealthExamProcessing;
  }

  private async processFile(item: HealthExamProcessing) {
    const fileBuffer = await this.downloadFile(item.fileUrl);

    if (item.fileType === 'PDF') {
      return this.processPdf(fileBuffer, item);
    }

    const base64 = fileBuffer.toString('base64');
    const mimeType = this.resolveImageMimeType(item.originalFilename);

    const user = this.resolveProcessingUser(item);
    return this.imageRecognitionService.analyzeHealthExamImage(
      base64,
      mimeType,
      user,
    );
  }

  private resolveImageMimeType(filename?: string | null): string {
    if (filename?.match(/\.png$/i)) return 'image/png';
    if (filename?.match(/\.webp$/i)) return 'image/webp';
    return 'image/jpeg';
  }

  private async processPdf(buffer: Buffer, item: HealthExamProcessing) {
    const pdfText = await parsePdfText(buffer, { processingId: item.id });
    const user = this.resolveProcessingUser(item);

    if (pdfText?.trim().length > 100) {
      const BLOCK_SIZE = 15000;
      const blocks = this.chunkText(pdfText, BLOCK_SIZE);

      // Processa cada bloco no Gemini (≤15k chars por chamada) e mescla resultados
      const results: ExtractedExamData[] = [];
      for (const block of blocks) {
        const partial = await this.textRecognitionService.analyzeHealthExamText(
          block,
          user,
        );
        results.push(partial);
      }

      return this.normalizeExtractedExamData(this.mergeExtractedData(results));
    }

    const base64 = buffer.toString('base64');
    return this.imageRecognitionService.analyzeHealthExamImage(
      base64,
      'application/pdf',
      user,
    );
  }

  /** Mescla múltiplos resultados parciais de blocos de texto em um único ExtractedExamData. */
  private mergeExtractedData(results: ExtractedExamData[]): ExtractedExamData {
    if (!results.length) return { items: [] };

    const examType = this.resolveMergedExamType(results);
    const rawItems = results.flatMap((r) => r.items ?? []);
    const items = this.isImagingLikeType(examType)
      ? this.mergeImagingItems(rawItems)
      : rawItems;

    return {
      labName: results.find((r) => r.labName)?.labName,
      doctorName: results.find((r) => r.doctorName)?.doctorName,
      examDate: results.find((r) => r.examDate)?.examDate,
      examType,
      items,
    };
  }

  private resolveMergedExamType(results: ExtractedExamData[]): HealthExamType {
    const declared = results
      .map((r) => r.examType)
      .filter((t): t is HealthExamType => Boolean(t) && t !== 'OTHER');

    const imagingLike = declared.find((t) => this.isImagingLikeType(t));
    if (imagingLike) return imagingLike;

    if (declared.includes('LABORATORY')) return 'LABORATORY';
    if (declared.length) return declared[0];

    return this.inferExamTypeFromItems(
      undefined,
      results.flatMap((r) => r.items ?? []),
    );
  }

  private isImagingLikeType(type?: HealthExamType): boolean {
    return type === 'IMAGING' || type === 'FUNCTIONAL' || type === 'PROCEDURE';
  }

  private mergeImagingItems(items: ExtractedExamItem[]): ExtractedExamItem[] {
    const map = new Map<string, ExtractedExamItem>();

    for (const item of items) {
      const key = (item.itemName ?? '').trim().toLowerCase() || '__default__';
      const existing = map.get(key);

      if (!existing) {
        map.set(key, { ...item });
        continue;
      }

      map.set(key, {
        ...existing,
        findings: [existing.findings, item.findings]
          .filter(Boolean)
          .join('\n\n'),
        conclusion: existing.conclusion ?? item.conclusion,
      });
    }

    return Array.from(map.values());
  }

  private normalizeExtractedExamData(
    data: ExtractedExamData,
  ): ExtractedExamData {
    return {
      ...data,
      examType: this.inferExamTypeFromItems(data.examType, data.items ?? []),
    };
  }

  private inferExamTypeFromItems(
    declared: ExtractedExamData['examType'] | undefined,
    items: ExtractedExamData['items'],
  ): ExtractedExamData['examType'] {
    if (declared && declared !== 'OTHER') return declared;

    const hasImagingFields = items.some((i) => i.findings?.trim());
    const hasLabFields = items.some(
      (i) =>
        i.resultValue?.trim() &&
        (i.referenceRange?.trim() || i.resultUnit?.trim()),
    );

    if (hasImagingFields && !hasLabFields) return 'IMAGING';
    if (hasLabFields) return 'LABORATORY';
    if (hasImagingFields) return 'IMAGING';

    return declared ?? 'OTHER';
  }

  private async downloadFile(url: string): Promise<Buffer> {
    return downloadUrlToBuffer(url, { maxBytes: HEALTH_MAX_FILE_BYTES });
  }

  private chunkText(text: string, size: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += size) {
      chunks.push(text.slice(i, i + size));
    }
    return chunks.length ? chunks : [''];
  }

  private buildExamsContext(exams: HealthExam[]): string {
    return exams
      .map((exam) => {
        const header = [
          `Exame: ${exam.examType} | Data: ${exam.examDate ?? 'N/A'}`,
          exam.labName ? `Lab/Clínica: ${exam.labName}` : '',
          exam.doctorName ? `Médico: ${exam.doctorName}` : '',
        ]
          .filter(Boolean)
          .join(' | ');

        const itemLines = (exam.items ?? [])
          .map((i) => {
            if (i.findings) {
              return `  - ${i.itemName}:\n    Laudo: ${i.findings}\n    Conclusão: ${i.conclusion ?? 'N/A'}`;
            }
            const abnormal = i.isAbnormal ? ' ⚠️ ANORMAL' : '';
            return `  - ${i.itemName}: ${i.resultValue ?? 'N/A'} ${i.resultUnit ?? ''}${abnormal} (Ref: ${i.referenceRange ?? 'N/A'})`;
          })
          .join('\n');

        return `${header}\n${itemLines}`;
      })
      .join('\n\n---\n\n');
  }

  private buildPatientContextSection(contexts: HealthPatientContext[]): string {
    if (!contexts.length) return '';

    const lines = [...contexts]
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .map((ctx) => {
        const date = new Date(ctx.createdAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        return `[${date}]\n${ctx.content}`;
      });

    return `INFORMAÇÕES ADICIONAIS DO PACIENTE (histórico):\n\n${lines.join('\n\n---\n\n')}`;
  }

  private buildPrescriptionSection(
    prescription: HealthPrescription | null,
  ): string {
    if (!prescription) return '';

    const header = [
      `Data da receita: ${prescription.prescriptionDate ?? 'N/A'}`,
      prescription.doctorName ? `Médico: ${prescription.doctorName}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    const itemLines = (prescription.items ?? [])
      .map((item) => {
        const parts = [`  - ${item.medicationName}`];
        if (item.dosage) parts.push(`Dosagem: ${item.dosage}`);
        if (item.scheduleTimes?.length) {
          parts.push(`Horários: ${item.scheduleTimes.join(', ')}`);
        }
        parts.push(
          item.daysOfWeek?.length
            ? `Dias: ${item.daysOfWeek.join(', ')}`
            : 'Dias: todos os dias',
        );
        parts.push(
          item.endDate
            ? `Uso até: ${item.endDate}`
            : 'Uso contínuo (sem data de término)',
        );
        if (item.notes) parts.push(`Obs.: ${item.notes}`);
        return parts.join(' | ');
      })
      .join('\n');

    const body = itemLines || '  Nenhum medicamento cadastrado.';
    const notes = prescription.notes
      ? `\nObservações da receita: ${prescription.notes}`
      : '';

    return `ÚLTIMO RECEITUÁRIO DO PACIENTE:\n${header}\n${body}${notes}`;
  }

  private buildPreviousReportSection(
    overview: HealthAiOverview | null,
  ): string {
    if (!overview) return '';

    const date = new Date(overview.generatedAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    return `RELATÓRIO ANTERIOR (gerado em ${date}) — use-o como base e gere uma versão ATUALIZADA e CONSOLIDADA incorporando os novos dados abaixo:\n\n${overview.reportContent}`;
  }

  // ─── Helpers de permissão ────────────────────────────────────────────────

  private async resolveTargetUserId(
    targetUserId: string | undefined,
    requestingUserId: string,
    isAdmin: boolean,
    groupId: string | null,
  ): Promise<string> {
    if (!targetUserId || targetUserId === requestingUserId) {
      return requestingUserId;
    }
    if (!isAdmin) {
      throw new ForbiddenException(
        'Apenas administradores podem gerenciar dados de outros membros.',
      );
    }
    if (!groupId) return requestingUserId;

    const inGroup = await this.memberRepo.isMemberOfGroup(
      targetUserId,
      groupId,
    );
    if (!inGroup) {
      throw new ForbiddenException('Usuário não pertence ao grupo familiar.');
    }
    return targetUserId;
  }

  private resolveProcessingOwnerId(item: HealthExamProcessing): string {
    const ownerId = item.targetUser?.id ?? item.uploadedBy?.id;
    if (!ownerId) {
      throw new NotFoundException('Processamento não encontrado');
    }
    return ownerId;
  }

  /** Usuário que dispara quota/auditoria de IA (quem fez o upload). */
  private resolveProcessingUser(item: HealthExamProcessing): User {
    const userId = item.uploadedBy?.id ?? item.targetUser?.id;
    if (!userId) {
      throw new Error(
        'Processamento sem uploadedBy/targetUser — recarregue relações no repositório',
      );
    }
    return { id: userId } as User;
  }

  private async assertCanView(
    resourceOwnerId: string,
    requestingUserId: string,
  ): Promise<void> {
    if (resourceOwnerId === requestingUserId) return;

    const ownerGroup =
      await this.memberRepo.findMembershipWithGroup(resourceOwnerId);
    const requesterGroup =
      await this.memberRepo.findMembershipWithGroup(requestingUserId);

    if (
      ownerGroup?.familyGroup?.id &&
      ownerGroup.familyGroup.id === requesterGroup?.familyGroup?.id
    ) {
      return;
    }

    throw new ForbiddenException('Sem permissão para visualizar este recurso.');
  }

  private async assertCanWrite(
    resourceOwnerId: string,
    requestingUserId: string,
  ): Promise<void> {
    if (resourceOwnerId === requestingUserId) return;

    const membership = await this.memberRepo.findMembership(requestingUserId);

    if (membership?.role === FAMILY_GROUP_ROLES.ADMIN) return;

    throw new ForbiddenException(
      'Apenas administradores podem editar dados de outros membros.',
    );
  }
}
