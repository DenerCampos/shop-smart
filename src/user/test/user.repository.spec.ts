import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/user.entity';
import { createRepositoryMock } from '../../common/test/typeorm-repository.mock';

describe('UserRepository', () => {
  let repository: UserRepository;
  let entityRepo: ReturnType<typeof createRepositoryMock<User>>;

  beforeEach(async () => {
    entityRepo = createRepositoryMock<User>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        { provide: getRepositoryToken(User), useValue: entityRepo },
      ],
    }).compile();

    repository = module.get(UserRepository);
  });

  describe('create', () => {
    it('salva sem busca por substring (igualdade tratada no service)', async () => {
      const dto = {
        name: 'Ana',
        email: 'ana@test.local',
        password: 'hash',
      };
      const created = { ...dto, id: 'u1' } as User;
      entityRepo.create.mockReturnValue(created);
      entityRepo.save.mockResolvedValue(created);

      const result = await repository.create(dto as any);

      expect(entityRepo.findOne).not.toHaveBeenCalled();
      expect(entityRepo.create).toHaveBeenCalledWith(dto);
      expect(entityRepo.save).toHaveBeenCalledWith(created);
      expect(result.id).toBe('u1');
    });
  });

  describe('exist', () => {
    it('usa igualdade exata de e-mail (sem ILike com %)', async () => {
      entityRepo.findOne.mockResolvedValue(null);
      const current = { id: 'u1' } as User;

      const result = await repository.exist('exact@test.local', current);

      expect(result).toBe(false);
      expect(entityRepo.findOne).toHaveBeenCalledWith({
        where: {
          email: 'exact@test.local',
          id: expect.anything(),
        },
        withDeleted: true,
      });
      const callArg = entityRepo.findOne.mock.calls[0][0] as {
        where: { email: string };
      };
      expect(String(callArg.where.email)).not.toContain('%');
    });

    it('retorna false quando email é undefined (evita %undefined%)', async () => {
      const result = await repository.exist(
        undefined as any,
        {
          id: 'u1',
        } as User,
      );
      expect(result).toBe(false);
      expect(entityRepo.findOne).not.toHaveBeenCalled();
    });

    it('considera e-mail de conta soft-deleted como existente', async () => {
      entityRepo.findOne.mockResolvedValue({
        id: 'u2',
        deletedAt: new Date(),
      } as User);
      const result = await repository.exist('gone@test.local', {
        id: 'u1',
      } as User);

      expect(result).toBe(true);
      expect(entityRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ withDeleted: true }),
      );
    });
  });

  describe('findByEmailWithDeleted', () => {
    it('busca com withDeleted true', async () => {
      const user = { id: 'u1', email: 'a@test.local' } as User;
      entityRepo.findOne.mockResolvedValue(user);

      const result = await repository.findByEmailWithDeleted('a@test.local');

      expect(entityRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'a@test.local' },
        withDeleted: true,
      });
      expect(result).toBe(user);
    });
  });

  describe('restore', () => {
    it('restaura soft-delete e retorna true quando afetou 1 linha', async () => {
      entityRepo.restore.mockResolvedValue({ affected: 1 } as any);

      const result = await repository.restore('u1');

      expect(entityRepo.restore).toHaveBeenCalledWith({ id: 'u1' });
      expect(result).toBe(true);
    });
  });
});
