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
    Pick<FamilyMemberResolverService, 'resolve' | 'getAcceptedMemberUserIds'>
  >;

  beforeEach(async () => {
    examRepo = {
      createExam: jest.fn().mockResolvedValue(makeExam()),
      findById: jest.fn().mockResolvedValue(makeExam()),
      findAll: jest
        .fn()
        .mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 }),
      findApprovedByUserId: jest.fn().mockResolvedValue([makeExam()]),
      findApprovedByUserIdChangedAfter: jest.fn().mockResolvedValue([]),
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
      findLatestByUserId: jest.fn().mockResolvedValue(null),
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
      findByFilters: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
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
      findByUserIdCreatedAfter: jest.fn().mockResolvedValue([]),
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
      getAcceptedMemberUserIds: jest.fn().mockResolvedValue(['user-1']),
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

    it('deve incluir o último receituário no contexto enviado à IA', async () => {
      prescriptionRepo.findLatestByUserId.mockResolvedValue({
        id: 'rx-1',
        prescriptionDate: '2026-06-10',
        doctorName: 'Dra. Souza',
        notes: null,
        items: [
          {
            medicationName: 'Losartana',
            dosage: '50mg',
            scheduleTimes: ['08:00'],
            daysOfWeek: null,
            endDate: null,
            notes: null,
          },
        ],
      } as any);

      await service.generateOverview(makeUser('user-1'), {
        patientContext: 'Pressão alta',
      });

      expect(prescriptionRepo.findLatestByUserId).toHaveBeenCalledWith(
        'user-1',
        null,
      );
      const contextArg =
        textRecognitionService.generateHealthOverview.mock.calls[0][0];
      expect(contextArg).toContain('ÚLTIMO RECEITUÁRIO DO PACIENTE');
      expect(contextArg).toContain('Losartana');
    });

    it('deve lançar BadRequestException na primeira geração sem exames nem contexto', async () => {
      examRepo.findApprovedByUserId.mockResolvedValue([]);

      await expect(
        service.generateOverview(makeUser('user-1'), {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve retornar o último relatório sem gerar quando não há dados novos', async () => {
      overviewRepo.findLatest.mockResolvedValue({
        id: 'ov-old',
        generatedAt: new Date('2026-06-01'),
        createdAt: new Date('2026-06-01'),
        reportContent: 'Relatório antigo',
      } as any);
      examRepo.findApprovedByUserIdChangedAfter.mockResolvedValue([]);
      patientContextRepo.findByUserIdCreatedAfter.mockResolvedValue([]);
      prescriptionRepo.findLatestByUserId.mockResolvedValue(null);

      const result = await service.generateOverview(makeUser('user-1'), {});

      expect(result).toEqual(expect.objectContaining({ id: 'ov-old' }));
      expect(
        textRecognitionService.generateHealthOverview,
      ).not.toHaveBeenCalled();
      expect(overviewRepo.save).not.toHaveBeenCalled();
    });

    it('do 2º relatório em diante envia apenas dados novos + relatório anterior', async () => {
      overviewRepo.findLatest.mockResolvedValue({
        id: 'ov-old',
        generatedAt: new Date('2026-06-01'),
        createdAt: new Date('2026-06-01'),
        reportContent: 'Relatório anterior de saúde',
      } as any);
      examRepo.findApprovedByUserIdChangedAfter.mockResolvedValue([
        makeExam({ id: 'exam-novo' }),
      ]);
      patientContextRepo.findByUserIdCreatedAfter.mockResolvedValue([
        { id: 'ctx-novo', content: 'novo sintoma', createdAt: new Date() } as any,
      ]);

      await service.generateOverview(makeUser('user-1'), {});

      expect(examRepo.findApprovedByUserId).not.toHaveBeenCalled();
      expect(examRepo.findApprovedByUserIdChangedAfter).toHaveBeenCalledWith(
        'user-1',
        new Date('2026-06-01'),
      );
      const contextArg =
        textRecognitionService.generateHealthOverview.mock.calls[0][0];
      expect(contextArg).toContain('RELATÓRIO ANTERIOR');
      expect(contextArg).toContain('Relatório anterior de saúde');
      expect(contextArg).toContain('NOVOS EXAMES DESDE O ÚLTIMO RELATÓRIO');
      expect(overviewRepo.save).toHaveBeenCalled();
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

  // ─── listOverviews ───────────────────────────────────────────────────────

  describe('listOverviews', () => {
    it('deve listar relatórios de todos os membros quando não há targetUserId (família toda)', async () => {
      familyMemberResolver.resolve.mockResolvedValueOnce({
        userIds: ['user-1', 'user-2'],
        isAdmin: true,
        groupId: 'group-1',
      });
      familyMemberResolver.getAcceptedMemberUserIds.mockResolvedValueOnce([
        'user-1',
        'user-2',
      ]);
      overviewRepo.findByFilters.mockResolvedValueOnce([
        { id: 'ov-1' } as any,
      ]);

      const result = await service.listOverviews(makeUser('user-1'), {
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      });

      expect(
        familyMemberResolver.getAcceptedMemberUserIds,
      ).toHaveBeenCalledWith('user-1');
      expect(overviewRepo.findByFilters).toHaveBeenCalledWith(
        ['user-1', 'user-2'],
        'group-1',
        '2026-07-01 00:00:00',
        '2026-07-31 23:59:59',
      );
      expect(result).toHaveLength(1);
    });

    it('deve filtrar por um único membro quando targetUserId é o próprio usuário', async () => {
      await service.listOverviews(makeUser('user-1'), {
        targetUserId: 'user-1',
      });

      expect(
        familyMemberResolver.getAcceptedMemberUserIds,
      ).not.toHaveBeenCalled();
      expect(overviewRepo.findByFilters).toHaveBeenCalledWith(
        ['user-1'],
        null,
        undefined,
        undefined,
      );
    });

    it('deve validar permissão ao filtrar relatórios de outro membro', async () => {
      memberRepo.findMembershipWithGroup
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await expect(
        service.listOverviews(makeUser('user-1'), { targetUserId: 'user-2' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── getOverviewById ───────────────────────────────────────────────────────

  describe('getOverviewById', () => {
    it('deve lançar NotFoundException quando relatório não existe', async () => {
      overviewRepo.findById.mockResolvedValueOnce(null);

      await expect(
        service.getOverviewById('ov-x', makeUser('user-1')),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve retornar o relatório do próprio usuário', async () => {
      overviewRepo.findById.mockResolvedValueOnce({
        id: 'ov-1',
        user: { id: 'user-1' },
      } as any);

      const result = await service.getOverviewById('ov-1', makeUser('user-1'));
      expect(result.id).toBe('ov-1');
    });

    it('deve lançar ForbiddenException ao acessar relatório de outro sem grupo', async () => {
      overviewRepo.findById.mockResolvedValueOnce({
        id: 'ov-1',
        user: { id: 'user-2' },
      } as any);
      memberRepo.findMembershipWithGroup
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await expect(
        service.getOverviewById('ov-1', makeUser('user-1')),
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

  // ─── createPatientContext ────────────────────────────────────────────────

  describe('createPatientContext', () => {
    it('deve criar descrição para o próprio usuário', async () => {
      patientContextRepo.create.mockResolvedValue({
        id: 'ctx-1',
        content: 'Com dor de cabeça hoje',
        createdAt: new Date(),
      } as any);

      const result = await service.createPatientContext(makeUser('user-1'), {
        content: 'Com dor de cabeça hoje',
      });

      expect(patientContextRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Com dor de cabeça hoje',
          user: expect.objectContaining({ id: 'user-1' }),
          createdBy: expect.objectContaining({ id: 'user-1' }),
        }),
      );
      expect(result).toBeDefined();
    });

    it('deve lançar BadRequestException para conteúdo vazio', async () => {
      await expect(
        service.createPatientContext(makeUser('user-1'), { content: '   ' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('membro comum não pode criar descrição para outro usuário', async () => {
      familyMemberResolver.resolve.mockResolvedValue({
        userIds: ['user-1'],
        isAdmin: false,
        groupId: null,
      });

      await expect(
        service.createPatientContext(makeUser('user-1'), {
          content: 'algo',
          targetUserId: 'user-2',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('admin pode criar descrição para outro membro do grupo', async () => {
      familyMemberResolver.resolve.mockResolvedValue({
        userIds: ['user-1', 'user-2'],
        isAdmin: true,
        groupId: 'group-1',
      });
      memberRepo.isMemberOfGroup.mockResolvedValue(true);
      patientContextRepo.create.mockResolvedValue({
        id: 'ctx-2',
        content: 'febre',
        createdAt: new Date(),
      } as any);

      await service.createPatientContext(makeUser('user-1'), {
        content: 'febre',
        targetUserId: 'user-2',
      });

      expect(patientContextRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ id: 'user-2' }),
        }),
      );
    });
  });

  // ─── getLatestPatientContext ─────────────────────────────────────────────

  describe('getLatestPatientContext', () => {
    it('deve retornar a descrição mais recente', async () => {
      patientContextRepo.findByUserId.mockResolvedValue([
        { id: 'ctx-new', content: 'recente', createdAt: new Date() } as any,
        { id: 'ctx-old', content: 'antiga', createdAt: new Date() } as any,
      ]);

      const result = await service.getLatestPatientContext(makeUser('user-1'));

      expect(result).toEqual(
        expect.objectContaining({ id: 'ctx-new' }),
      );
    });

    it('deve retornar null quando não há descrições', async () => {
      patientContextRepo.findByUserId.mockResolvedValue([]);

      const result = await service.getLatestPatientContext(makeUser('user-1'));

      expect(result).toBeNull();
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
