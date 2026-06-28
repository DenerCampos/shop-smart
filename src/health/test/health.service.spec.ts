import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { HealthService } from '../health.service';
import { IHealthExamRepository } from '../interfaces/health-exam.repository.interface';
import { IHealthProcessingRepository } from '../interfaces/health-processing.repository.interface';
import { IHealthPrescriptionRepository } from '../interfaces/health-prescription.repository.interface';
import { IHealthOverviewRepository } from '../interfaces/health-overview.repository.interface';
import { IHealthMemberRepository } from '../interfaces/health-member.repository.interface';
import { IHealthPatientContextRepository } from '../interfaces/health-patient-context.repository.interface';
import { FamilyMemberResolverService } from '../../common/family-member-resolver/family-member-resolver.service';
import { Pagination } from '../../common/pagination/pagination';
import { AppConfig } from '../../common/app-config/app.config';
import { TextRecognitionService } from '../../text-recognition/textRecognition.service';
import { ImageRecognitionService } from '../../image-recognition/imageRecognition.service';
import { FILE_STORAGE } from '../../file-storage/file-storage.constants';
import { createAppConfigMock } from '../../common/test/app-config.mock';
import { User } from '../../user/entities/user.entity';
import { HealthExam } from '../entities/health-exam.entity';
import { HealthExamProcessing } from '../entities/health-exam-processing.entity';
import { FamilyGroupMember } from '../../family-group/entities/family-group-member.entity';
import { FAMILY_GROUP_ROLES } from '../../family-group/types/family-group-role.type';

jest.mock('src/common/pdf/pdf-parser.util', () => ({
  parsePdfText: jest.fn(),
}));

import { parsePdfText } from 'src/common/pdf/pdf-parser.util';

const makeUser = (id = 'user-1'): User => {
  const u = new User();
  u.id = id;
  u.name = 'Usuário Teste';
  u.email = `${id}@test.local`;
  u.password = 'x';
  return u;
};

const makeExam = (overrides: Partial<HealthExam> = {}): HealthExam => {
  const e = new HealthExam();
  e.id = 'exam-1';
  e.examType = 'LABORATORY';
  e.sourceType = 'MANUAL';
  e.status = 'APPROVED';
  e.user = makeUser('user-1');
  e.items = [];
  e.files = [];
  return Object.assign(e, overrides);
};

const makeProcessing = (
  overrides: Partial<HealthExamProcessing> = {},
): HealthExamProcessing => {
  const p = new HealthExamProcessing();
  p.id = 'proc-1';
  p.fileType = 'PDF';
  p.fileUrl = 'https://storage.example.com/health/file.pdf';
  p.status = 'COMPLETED';
  p.uploadedBy = makeUser('user-1');
  p.targetUser = makeUser('user-1');
  p.extractedData = {
    labName: 'Lab Teste',
    examDate: '2026-06-01',
    examType: 'LABORATORY',
    items: [{ itemName: 'UREIA', resultValue: '30', isAbnormal: false }],
  };
  return Object.assign(p, overrides);
};

describe('HealthService', () => {
  let service: HealthService;
  let examRepo: jest.Mocked<IHealthExamRepository>;
  let processingRepo: jest.Mocked<IHealthProcessingRepository>;
  let prescriptionRepo: jest.Mocked<IHealthPrescriptionRepository>;
  let overviewRepo: jest.Mocked<IHealthOverviewRepository>;
  let memberRepo: jest.Mocked<IHealthMemberRepository>;
  let patientContextRepo: jest.Mocked<IHealthPatientContextRepository>;
  let textRecognitionService: {
    analyzeHealthExamText: jest.Mock;
    analyzeHealthLabText: jest.Mock;
    generateHealthOverview: jest.Mock;
    analyzePrescription: jest.Mock;
  };
  let imageRecognitionService: {
    analyzeHealthExamImage: jest.Mock;
    analyzeHealthLabImage: jest.Mock;
    analyzeHealthImaging: jest.Mock;
    analyzePrescriptionImage: jest.Mock;
  };
  let familyMemberResolver: jest.Mocked<
    Pick<FamilyMemberResolverService, 'resolve'>
  >;

  beforeEach(async () => {
    examRepo = {
      createExam: jest.fn().mockResolvedValue(makeExam()),
      findById: jest.fn().mockResolvedValue(makeExam()),
      findAll: jest
        .fn()
        .mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 }),
      findApprovedByUserId: jest.fn().mockResolvedValue([makeExam()]),
      countApprovedUpdatedAfter: jest.fn().mockResolvedValue(0),
      saveExam: jest.fn().mockResolvedValue(makeExam()),
      replaceItems: jest.fn().mockResolvedValue(undefined),
      attachFiles: jest.fn().mockResolvedValue(undefined),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };

    processingRepo = {
      create: jest.fn().mockResolvedValue(makeProcessing()),
      findById: jest.fn().mockResolvedValue(makeProcessing()),
      findForUser: jest.fn().mockResolvedValue([makeProcessing()]),
      findQueued: jest.fn().mockResolvedValue([]),
      findFailedReadyForAutoRetry: jest.fn().mockResolvedValue([]),
      updateStatus: jest.fn().mockResolvedValue(undefined),
      deleteById: jest.fn().mockResolvedValue(undefined),
    };

    prescriptionRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest
        .fn()
        .mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 }),
      save: jest.fn(),
      replaceItems: jest.fn(),
      softDelete: jest.fn(),
    };

    overviewRepo = {
      save: jest.fn(),
      findLatest: jest.fn().mockResolvedValue(null),
    };

    memberRepo = {
      findMembership: jest.fn().mockResolvedValue(null),
      findMembershipWithGroup: jest.fn().mockResolvedValue(null),
      isMemberOfGroup: jest.fn().mockResolvedValue(true),
    };

    patientContextRepo = {
      create: jest.fn().mockResolvedValue({
        id: 'ctx-1',
        content: 'teste',
        createdAt: new Date(),
      }),
      findByUserId: jest.fn().mockResolvedValue([]),
      countCreatedAfter: jest.fn().mockResolvedValue(0),
    };

    textRecognitionService = {
      analyzeHealthExamText: jest.fn(),
      analyzeHealthLabText: jest.fn(),
      generateHealthOverview: jest.fn(),
      analyzePrescription: jest.fn(),
    };

    imageRecognitionService = {
      analyzeHealthExamImage: jest.fn(),
      analyzeHealthLabImage: jest.fn(),
      analyzeHealthImaging: jest.fn(),
      analyzePrescriptionImage: jest.fn(),
    };

    familyMemberResolver = {
      resolve: jest.fn().mockResolvedValue({
        userIds: ['user-1'],
        isAdmin: false,
        groupId: null,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: 'IHealthExamRepository', useValue: examRepo },
        { provide: 'IHealthProcessingRepository', useValue: processingRepo },
        {
          provide: 'IHealthPrescriptionRepository',
          useValue: prescriptionRepo,
        },
        { provide: 'IHealthOverviewRepository', useValue: overviewRepo },
        { provide: 'IHealthMemberRepository', useValue: memberRepo },
        {
          provide: 'IHealthPatientContextRepository',
          useValue: patientContextRepo,
        },
        {
          provide: FamilyMemberResolverService,
          useValue: familyMemberResolver,
        },
        { provide: AppConfig, useValue: createAppConfigMock() },
        Pagination,
        {
          provide: TextRecognitionService,
          useValue: textRecognitionService,
        },
        {
          provide: ImageRecognitionService,
          useValue: imageRecognitionService,
        },
        {
          provide: FILE_STORAGE,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue({
              fileId: 'f1',
              fileName: 'file.pdf',
              webViewLink: 'https://storage.example.com/health/file.pdf',
              webContentLink: 'https://storage.example.com/dl/file.pdf',
            }),
            deleteFile: jest.fn().mockResolvedValue(undefined),
            extractFileIdFromUrl: jest.fn().mockReturnValue('f1'),
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  // ─── createExam ──────────────────────────────────────────────────────────

  describe('createExam', () => {
    it('deve criar exame para o próprio usuário', async () => {
      const user = makeUser('user-1');
      const result = await service.createExam(user, {
        examType: 'LABORATORY',
        items: [],
      });

      expect(examRepo.createExam).toHaveBeenCalledWith(
        expect.objectContaining({ sourceType: 'MANUAL', status: 'APPROVED' }),
        [],
      );
      expect(result).toBeDefined();
    });

    it('deve lançar ForbiddenException quando membro tenta criar exame para outro usuário', async () => {
      familyMemberResolver.resolve.mockResolvedValue({
        userIds: ['user-1'],
        isAdmin: false,
        groupId: null,
      });

      await expect(
        service.createExam(makeUser('user-1'), {
          examType: 'LABORATORY',
          targetUserId: 'user-2',
          items: [],
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('admin pode criar exame para outro membro do grupo', async () => {
      familyMemberResolver.resolve.mockResolvedValue({
        userIds: ['user-1', 'user-2'],
        isAdmin: true,
        groupId: 'group-1',
      });
      memberRepo.isMemberOfGroup.mockResolvedValue(true);

      await service.createExam(makeUser('user-1'), {
        examType: 'LABORATORY',
        targetUserId: 'user-2',
        items: [],
      });

      expect(examRepo.createExam).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ id: 'user-2' }),
        }),
        [],
      );
    });
  });

  // ─── getExamById ─────────────────────────────────────────────────────────

  describe('getExamById', () => {
    it('deve retornar o exame quando o dono é o próprio usuário', async () => {
      const exam = await service.getExamById('exam-1', makeUser('user-1'));
      expect(exam).toBeDefined();
    });

    it('deve lançar NotFoundException quando exame não existe', async () => {
      examRepo.findById.mockResolvedValue(null);

      await expect(
        service.getExamById('nao-existe', makeUser('user-1')),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ForbiddenException quando usuário tenta acessar exame de outro sem grupo comum', async () => {
      examRepo.findById.mockResolvedValue(
        makeExam({ user: makeUser('user-2') }),
      );
      memberRepo.findMembershipWithGroup
        .mockResolvedValueOnce(null) // owner sem grupo
        .mockResolvedValueOnce(null); // requester sem grupo

      await expect(
        service.getExamById('exam-1', makeUser('user-1')),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── listExams ───────────────────────────────────────────────────────────

  describe('listExams', () => {
    it('deve lançar ForbiddenException ao filtrar userId de outro sem grupo comum', async () => {
      memberRepo.findMembershipWithGroup
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await expect(
        service.listExams(makeUser('user-1'), { userId: 'user-2', page: '1' }),
      ).rejects.toThrow(ForbiddenException);

      expect(examRepo.findAll).not.toHaveBeenCalled();
    });
  });

  // ─── assertCanWrite ───────────────────────────────────────────────────────

  describe('assertCanWrite (via updateExam)', () => {
    it('deve lançar ForbiddenException quando membro comum tenta editar exame de outro', async () => {
      examRepo.findById.mockResolvedValue(
        makeExam({ user: makeUser('user-2') }),
      );
      // findMembershipWithGroup retorna null (mesmo grupo) — assertCanView não lança
      memberRepo.findMembershipWithGroup
        .mockResolvedValueOnce({
          familyGroup: { id: 'group-1' },
        } as FamilyGroupMember) // owner
        .mockResolvedValueOnce({
          familyGroup: { id: 'group-1' },
        } as FamilyGroupMember); // requester
      // assertCanWrite: não é admin
      memberRepo.findMembership.mockResolvedValue({
        role: FAMILY_GROUP_ROLES.MEMBER,
      } as FamilyGroupMember);

      await expect(
        service.updateExam('exam-1', makeUser('user-1'), {
          examType: 'IMAGING',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('admin pode editar exame de outro membro', async () => {
      examRepo.findById.mockResolvedValue(
        makeExam({ user: makeUser('user-2') }),
      );
      // findMembershipWithGroup é chamado 2x por assertCanView, e updateExam chama
      // getExamById duas vezes (início + retorno), então precisamos de valor reutilizável
      memberRepo.findMembershipWithGroup.mockResolvedValue({
        familyGroup: { id: 'group-1' },
      } as FamilyGroupMember);
      memberRepo.findMembership.mockResolvedValue({
        role: FAMILY_GROUP_ROLES.ADMIN,
      } as FamilyGroupMember);

      const result = await service.updateExam('exam-1', makeUser('user-1'), {
        examType: 'IMAGING',
      });

      expect(examRepo.saveExam).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // ─── approveProcessing ───────────────────────────────────────────────────

  describe('approveProcessing', () => {
    it('deve criar exame com dados extraídos e remover o processamento', async () => {
      const user = makeUser('user-1');
      const processing = makeProcessing();
      processingRepo.findById.mockResolvedValue(processing);

      await service.approveProcessing('proc-1', user, {});

      expect(examRepo.createExam).toHaveBeenCalledWith(
        expect.objectContaining({
          labName: 'Lab Teste',
          examDate: '2026-06-01',
          examType: 'LABORATORY',
          sourceType: 'PDF',
          status: 'APPROVED',
        }),
        expect.arrayContaining([
          expect.objectContaining({ itemName: 'UREIA' }),
        ]),
      );
      expect(examRepo.attachFiles).toHaveBeenCalledWith(
        'exam-1',
        [
          expect.objectContaining({
            fileUrl: processing.fileUrl,
            fileType: 'PDF',
          }),
        ],
      );
      expect(processingRepo.deleteById).toHaveBeenCalledWith('proc-1');
    });

    it('dados do DTO substituem os dados extraídos pela IA', async () => {
      processingRepo.findById.mockResolvedValue(makeProcessing());

      await service.approveProcessing('proc-1', makeUser('user-1'), {
        labName: 'Lab Corrigido',
        examType: 'IMAGING',
      });

      expect(examRepo.createExam).toHaveBeenCalledWith(
        expect.objectContaining({
          labName: 'Lab Corrigido',
          examType: 'IMAGING',
        }),
        expect.any(Array),
      );
    });

    it('deve lançar NotFoundException quando processamento não existe', async () => {
      processingRepo.findById.mockResolvedValue(null);

      await expect(
        service.approveProcessing('nao-existe', makeUser('user-1'), {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando status não é COMPLETED', async () => {
      processingRepo.findById.mockResolvedValue(
        makeProcessing({ status: 'QUEUED' }),
      );

      await expect(
        service.approveProcessing('proc-1', makeUser('user-1'), {}),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── generateOverview ────────────────────────────────────────────────────

  describe('generateOverview', () => {
    beforeEach(() => {
      overviewRepo.save.mockResolvedValue({
        id: 'ov-1',
        reportContent: 'Relatório',
        generatedAt: new Date(),
      } as any);
      textRecognitionService.generateHealthOverview.mockResolvedValue(
        'Relatório gerado',
      );
    });

    it('deve gerar relatório com exames e contexto opcional', async () => {
      await service.generateOverview(makeUser('user-1'), {
        patientContext: 'Dor de cabeça frequente',
      });

      expect(patientContextRepo.create).toHaveBeenCalled();
      expect(textRecognitionService.generateHealthOverview).toHaveBeenCalled();
      expect(overviewRepo.save).toHaveBeenCalled();
    });

    it('deve lançar BadRequestException na primeira geração sem exames nem contexto', async () => {
      examRepo.findApprovedByUserId.mockResolvedValue([]);

      await expect(
        service.generateOverview(makeUser('user-1'), {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException ao regenerar sem dados novos', async () => {
      overviewRepo.findLatest.mockResolvedValue({
        id: 'ov-old',
        generatedAt: new Date('2026-06-01'),
      } as any);
      examRepo.countApprovedUpdatedAfter.mockResolvedValue(0);
      patientContextRepo.countCreatedAfter.mockResolvedValue(0);

      await expect(
        service.generateOverview(makeUser('user-1'), {}),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── getLatestOverview ───────────────────────────────────────────────────

  describe('getLatestOverview', () => {
    it('deve retornar null quando não há overview salvo', async () => {
      const result = await service.getLatestOverview(makeUser('user-1'));
      expect(result).toBeNull();
    });

    it('deve lançar ForbiddenException quando usuário tenta acessar overview de outro sem grupo', async () => {
      memberRepo.findMembershipWithGroup
        .mockResolvedValueOnce(null) // owner sem grupo
        .mockResolvedValueOnce(null); // requester sem grupo

      await expect(
        service.getLatestOverview(makeUser('user-1'), 'user-2'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── discardProcessing ───────────────────────────────────────────────────

  describe('discardProcessing', () => {
    it('deve remover arquivo do storage e excluir o processamento', async () => {
      const user = makeUser('user-1');
      await service.discardProcessing('proc-1', user);

      expect(processingRepo.deleteById).toHaveBeenCalledWith('proc-1');
    });
  });

  // ─── retryProcessing ─────────────────────────────────────────────────────

  describe('retryProcessing', () => {
    it('deve lançar BadRequestException quando status não é FAILED', async () => {
      processingRepo.findById.mockResolvedValue(
        makeProcessing({ status: 'COMPLETED' }),
      );

      await expect(
        service.retryProcessing('proc-1', makeUser('user-1')),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve reenfileirar sem processar na requisição quando status é FAILED', async () => {
      const failed = makeProcessing({
        status: 'FAILED',
        errorMessage: 'Erro IA',
        failedAt: new Date(),
        retryCount: 1,
      });
      const requeued = makeProcessing({
        status: 'QUEUED',
        errorMessage: null,
        failedAt: null,
      });

      processingRepo.findById
        .mockResolvedValueOnce(failed)
        .mockResolvedValueOnce(requeued);

      const processFileSpy = jest.spyOn(service as any, 'processFile');

      const result = await service.retryProcessing('proc-1', makeUser('user-1'));

      expect(processingRepo.updateStatus).toHaveBeenCalledWith(
        'proc-1',
        'QUEUED',
        expect.objectContaining({ errorMessage: null, failedAt: null }),
      );
      expect(processFileSpy).not.toHaveBeenCalled();
      expect(result.status).toBe('QUEUED');
    });
  });

  // ─── processNextQueued ───────────────────────────────────────────────────

  describe('processNextQueued', () => {
    it('deve buscar FAILED elegíveis quando sobrar vaga no lote', async () => {
      processingRepo.findQueued.mockResolvedValue([makeProcessing({ status: 'QUEUED' })]);
      processingRepo.findFailedReadyForAutoRetry.mockResolvedValue([]);

      jest.spyOn(service as any, 'processFile').mockResolvedValue({
        labName: 'Lab',
        examDate: '2026-06-01',
        examType: 'LABORATORY',
        items: [],
      });

      await service.processNextQueued();

      expect(processingRepo.findFailedReadyForAutoRetry).toHaveBeenCalledWith(
        2,
        2 * 60 * 60 * 1000,
      );
    });

    it('deve reenfileirar FAILED elegível antes de reprocessar', async () => {
      const failed = makeProcessing({
        status: 'FAILED',
        errorMessage: 'timeout',
        failedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        retryCount: 1,
      });
      processingRepo.findQueued.mockResolvedValue([]);
      processingRepo.findFailedReadyForAutoRetry.mockResolvedValue([failed]);
      processingRepo.findById.mockResolvedValue(failed);

      jest.spyOn(service as any, 'processFile').mockRejectedValue(new Error('falhou de novo'));

      await service.processNextQueued();

      expect(processingRepo.updateStatus).toHaveBeenCalledWith(
        'proc-1',
        'QUEUED',
        expect.objectContaining({ errorMessage: null, failedAt: null }),
      );
      expect(processingRepo.updateStatus).toHaveBeenCalledWith(
        'proc-1',
        'FAILED',
        expect.objectContaining({
          errorMessage: 'falhou de novo',
          retryCount: 2,
        }),
      );
    });
  });

  // ─── analyzePrescription ─────────────────────────────────────────────────

  describe('analyzePrescription', () => {
    const makeFile = (
      mimetype: string,
      content = 'conteudo-teste',
    ): Express.Multer.File =>
      ({
        mimetype,
        buffer: Buffer.from(content),
      }) as Express.Multer.File;

    it('deve lançar BadRequestException para arquivo vazio', async () => {
      await expect(
        service.analyzePrescription(makeUser(), {
          mimetype: 'image/jpeg',
          buffer: Buffer.alloc(0),
        } as Express.Multer.File),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve usar text-recognition para PDF com texto extraível', async () => {
      const longText = 'a'.repeat(120);
      (parsePdfText as jest.Mock).mockResolvedValue(longText);
      const extracted = {
        doctorName: 'Dr. Silva',
        prescriptionDate: '2026-06-01',
        items: [{ medicationName: 'Dipirona' }],
      };
      textRecognitionService.analyzePrescription.mockResolvedValue(extracted);

      const result = await service.analyzePrescription(
        makeUser(),
        makeFile('application/pdf'),
      );

      expect(textRecognitionService.analyzePrescription).toHaveBeenCalledWith(
        longText,
        expect.any(User),
      );
      expect(result).toEqual(extracted);
    });

    it('deve usar image-recognition para PDF escaneado sem texto', async () => {
      (parsePdfText as jest.Mock).mockResolvedValue('curto');
      const extracted = {
        doctorName: 'Dr. Lima',
        items: [{ medicationName: 'Paracetamol' }],
      };
      imageRecognitionService.analyzePrescriptionImage.mockResolvedValue(
        extracted,
      );

      const file = makeFile('application/pdf', 'pdf-bytes');
      const result = await service.analyzePrescription(makeUser(), file);

      expect(imageRecognitionService.analyzePrescriptionImage).toHaveBeenCalledWith(
        file.buffer.toString('base64'),
        'application/pdf',
        expect.any(User),
      );
      expect(result).toEqual(extracted);
    });

    it('deve usar image-recognition para imagem JPEG', async () => {
      const extracted = {
        items: [{ medicationName: 'Losartana' }],
      };
      imageRecognitionService.analyzePrescriptionImage.mockResolvedValue(
        extracted,
      );

      const file = makeFile('image/jpeg');
      const result = await service.analyzePrescription(makeUser(), file);

      expect(imageRecognitionService.analyzePrescriptionImage).toHaveBeenCalledWith(
        file.buffer.toString('base64'),
        'image/jpeg',
        expect.any(User),
      );
      expect(result).toEqual(extracted);
    });
  });
});
