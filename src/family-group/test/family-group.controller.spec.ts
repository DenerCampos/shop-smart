import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FamilyGroupController } from '../family-group.controller';
import { FamilyGroupService } from '../family-group.service';
import { ResponseService } from 'src/common/response/response';
import { AuthGuard } from 'src/auth/auth.guard';
import { createTestUser } from 'src/common/test/user.fixture';

describe('FamilyGroupController', () => {
  let controller: FamilyGroupController;
  let familyGroupService: Record<string, jest.Mock>;
  let responseService: { mapToDto: jest.Mock; mapArrayToDto: jest.Mock };

  beforeEach(async () => {
    familyGroupService = {
      create: jest.fn().mockResolvedValue({ id: 'g1' }),
      findGroupsByUser: jest.fn().mockResolvedValue([]),
      getPendingInvitations: jest.fn().mockResolvedValue([]),
      acceptInvitation: jest.fn().mockResolvedValue({ id: 'm1' }),
      rejectInvitation: jest.fn().mockResolvedValue({ id: 'm2' }),
      findGroupById: jest.fn().mockResolvedValue({ id: 'g1' }),
      updateGroup: jest.fn().mockResolvedValue({ id: 'g1' }),
      uploadGroupImage: jest.fn().mockResolvedValue({ id: 'g1' }),
      deleteGroup: jest.fn().mockResolvedValue(true),
      inviteMember: jest.fn().mockResolvedValue({ id: 'm3' }),
      getMembers: jest.fn().mockResolvedValue([]),
      updateMemberRole: jest.fn().mockResolvedValue({ id: 'm4' }),
      removeMember: jest.fn().mockResolvedValue(true),
      leaveGroup: jest.fn().mockResolvedValue(true),
      getGroupSummary: jest.fn().mockResolvedValue({ totals: {} }),
      getMemberData: jest.fn().mockResolvedValue({ userId: 'u2' }),
    };

    responseService = {
      mapToDto: jest.fn().mockImplementation((_dto, entity) => entity),
      mapArrayToDto: jest.fn().mockImplementation((_dto, arr) => arr),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FamilyGroupController],
      providers: [
        { provide: FamilyGroupService, useValue: familyGroupService },
        { provide: ResponseService, useValue: responseService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(FamilyGroupController);
  });

  const user = () => createTestUser();

  it('create chama serviço com usuário, nome e brasão', async () => {
    const u = user();
    await controller.create(u, {
      name: 'Família',
      coatOfArms: '/assets/images/brasao/brasao-2.png',
    } as never);
    expect(familyGroupService.create).toHaveBeenCalledWith(
      u,
      'Família',
      '/assets/images/brasao/brasao-2.png',
    );
  });

  it('findAll lista grupos do usuário', async () => {
    const u = user();
    await controller.findAll(u);
    expect(familyGroupService.findGroupsByUser).toHaveBeenCalledWith(u.id);
  });

  it('getInvitations retorna convites pendentes', async () => {
    const u = user();
    await controller.getInvitations(u);
    expect(familyGroupService.getPendingInvitations).toHaveBeenCalledWith(u);
  });

  it('acceptInvitation e rejectInvitation repassam id e user', async () => {
    const u = user();
    await controller.acceptInvitation('inv-1', u);
    expect(familyGroupService.acceptInvitation).toHaveBeenCalledWith(
      'inv-1',
      u.id,
    );
    await controller.rejectInvitation('inv-2', u);
    expect(familyGroupService.rejectInvitation).toHaveBeenCalledWith(
      'inv-2',
      u.id,
    );
  });

  it('findOne, update e delete usam id do grupo e usuário', async () => {
    const u = user();
    await controller.findOne('g1', u);
    expect(familyGroupService.findGroupById).toHaveBeenCalledWith('g1', u.id);
    await controller.update('g1', u, {
      name: 'Novo',
      coatOfArms: '/assets/images/brasao/brasao-4.png',
    } as never);
    expect(familyGroupService.updateGroup).toHaveBeenCalledWith(
      'g1',
      u.id,
      'Novo',
      '/assets/images/brasao/brasao-4.png',
    );
    await controller.delete('g1', u);
    expect(familyGroupService.deleteGroup).toHaveBeenCalledWith('g1', u.id);
  });

  it('inviteMember, getMembers, updateMemberRole, removeMember, leaveGroup', async () => {
    const u = user();
    await controller.inviteMember('g1', u, { email: 'a@b.com' } as never);
    expect(familyGroupService.inviteMember).toHaveBeenCalledWith(
      'g1',
      u.id,
      'a@b.com',
    );
    await controller.getMembers('g1', u);
    expect(familyGroupService.getMembers).toHaveBeenCalledWith('g1', u.id);
    await controller.updateMemberRole('g1', 'm1', u, {
      role: 'admin',
    } as never);
    expect(familyGroupService.updateMemberRole).toHaveBeenCalledWith(
      'g1',
      'm1',
      u.id,
      'admin',
    );
    await controller.removeMember('g1', 'm1', u);
    expect(familyGroupService.removeMember).toHaveBeenCalledWith(
      'g1',
      'm1',
      u.id,
    );
    await controller.leaveGroup('g1', u);
    expect(familyGroupService.leaveGroup).toHaveBeenCalledWith('g1', u.id);
  });

  describe('uploadGroupImage', () => {
    const image = (mimetype: string) =>
      ({
        buffer: Buffer.from('img'),
        mimetype,
        originalname: 'foto.png',
      }) as Express.Multer.File;

    it('repassa grupo, usuário e arquivo ao serviço', async () => {
      const u = user();
      const file = image('image/png');
      await controller.uploadGroupImage('g1', u, file);
      expect(familyGroupService.uploadGroupImage).toHaveBeenCalledWith(
        'g1',
        u.id,
        file,
      );
    });

    it('rejeita requisição sem arquivo', async () => {
      const u = user();
      await expect(
        controller.uploadGroupImage('g1', u, undefined as never),
      ).rejects.toThrow(BadRequestException);
      expect(familyGroupService.uploadGroupImage).not.toHaveBeenCalled();
    });

    it('rejeita mimetype que não é imagem permitida', async () => {
      const u = user();
      await expect(
        controller.uploadGroupImage('g1', u, image('application/pdf')),
      ).rejects.toThrow(BadRequestException);
      expect(familyGroupService.uploadGroupImage).not.toHaveBeenCalled();
    });
  });

  it('getGroupSummary e getMemberData repassam filtro mês/ano', async () => {
    const u = user();
    const filter = { month: 3, year: 2025 } as never;
    await controller.getGroupSummary('g1', u, filter);
    expect(familyGroupService.getGroupSummary).toHaveBeenCalledWith(
      'g1',
      u.id,
      3,
      2025,
    );
    await controller.getMemberData('g1', 'u2', u, filter);
    expect(familyGroupService.getMemberData).toHaveBeenCalledWith(
      'g1',
      'u2',
      u.id,
      3,
      2025,
    );
  });
});
