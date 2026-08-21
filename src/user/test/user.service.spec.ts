import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { EventEmitter } from 'events';
import { DataSource, QueryFailedError } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user.service';
import { IUserRepository } from '../interfaces/user.repository.interface';
import { AppConfig } from '../../common/app-config/app.config';
import { EVENT_EMITTER } from '../../common/event-emitter/event-emitter.provider';
import { User } from '../entities/user.entity';
import {
  AccountDeletedReactivationRequiredException,
  EmailAlreadyExistsException,
  FamilyGroupOwnerCannotDeleteException,
  InvalidPasswordException,
  LastFamilyGroupAdminException,
  UserLimitReachedException,
} from '../../exception/authErrorException';
import { NotExistException } from '../../exception/notExistException';
import { UpdateException } from '../../exception/updateException';
import { createAppConfigMock } from '../../common/test/app-config.mock';
import { FamilyMemberResolverService } from '../../common/family-member-resolver/family-member-resolver.service';
import { PasswordResetToken } from '../../auth/entities/password-reset-token.entity';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<IUserRepository>;
  let eventEmitter: EventEmitter;
  let familyMemberResolver: {
    isAdminOfAnyGroup: jest.Mock;
    isOwnerOfAnyActiveGroup: jest.Mock;
    isSoleAcceptedAdminOfAnyGroup: jest.Mock;
    softDeleteMembershipsForUser: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };
  let txManager: {
    getRepository: jest.Mock;
  };

  beforeEach(async () => {
    userRepository = {
      countAll: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
      findByEmail: jest.fn(),
      findByEmailWithDeleted: jest.fn().mockResolvedValue(null),
      searchByEmailPrefix: jest.fn(),
      saveToken: jest.fn(),
      clearAuthTokens: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
      invalidateSession: jest.fn(),
      remove: jest.fn(),
      exist: jest.fn(),
      saveRefreshToken: jest.fn(),
      findByRefreshToken: jest.fn(),
    };
    familyMemberResolver = {
      isAdminOfAnyGroup: jest.fn().mockResolvedValue(true),
      isOwnerOfAnyActiveGroup: jest.fn().mockResolvedValue(false),
      isSoleAcceptedAdminOfAnyGroup: jest.fn().mockResolvedValue(false),
      softDeleteMembershipsForUser: jest.fn().mockResolvedValue(undefined),
    };
    const resetTokenQb = {
      delete: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    txManager = {
      getRepository: jest.fn().mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(resetTokenQb),
      }),
    };
    dataSource = {
      transaction: jest.fn(async (cb: (manager: unknown) => Promise<unknown>) =>
        cb(txManager),
      ),
    };
    eventEmitter = new EventEmitter();
    jest.spyOn(eventEmitter, 'emit');

    const appConfig = createAppConfigMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: 'IUserRepository', useValue: userRepository },
        { provide: AppConfig, useValue: appConfig },
        { provide: EVENT_EMITTER, useValue: eventEmitter },
        {
          provide: FamilyMemberResolverService,
          useValue: familyMemberResolver,
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(UserService);
  });

  describe('create', () => {
    it('lança UserLimitReachedException quando limite de usuários é atingido', async () => {
      userRepository.countAll.mockResolvedValue(15);

      await expect(
        service.create({
          name: 'A',
          email: 'a@test.local',
          password: 'secret12',
        } as any),
      ).rejects.toBeInstanceOf(UserLimitReachedException);
    });

    it('lança EmailAlreadyExistsException quando e-mail ativo já existe', async () => {
      userRepository.countAll.mockResolvedValue(0);
      const existing = new User();
      existing.email = 'taken@test.local';
      existing.deletedAt = undefined as any;
      userRepository.findByEmailWithDeleted.mockResolvedValue(existing);

      await expect(
        service.create({
          name: 'A',
          email: 'taken@test.local',
          password: 'secret12',
        } as any),
      ).rejects.toBeInstanceOf(EmailAlreadyExistsException);
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('lança AccountDeletedReactivationRequiredException quando e-mail está soft-deleted', async () => {
      userRepository.countAll.mockResolvedValue(0);
      const existing = new User();
      existing.email = 'gone@test.local';
      existing.deletedAt = new Date();
      userRepository.findByEmailWithDeleted.mockResolvedValue(existing);

      await expect(
        service.create({
          name: 'A',
          email: 'gone@test.local',
          password: 'secret12',
        } as any),
      ).rejects.toBeInstanceOf(AccountDeletedReactivationRequiredException);
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('converte ER_DUP_ENTRY (1062) em EmailAlreadyExistsException', async () => {
      userRepository.countAll.mockResolvedValue(0);
      userRepository.findByEmailWithDeleted.mockResolvedValue(null);
      const dup = new QueryFailedError('INSERT', [], new Error('dup'));
      (dup as any).driverError = { errno: 1062, code: 'ER_DUP_ENTRY' };
      userRepository.create.mockRejectedValue(dup);

      await expect(
        service.create({
          name: 'A',
          email: 'race@test.local',
          password: 'secret12',
        } as any),
      ).rejects.toBeInstanceOf(EmailAlreadyExistsException);
    });

    it('hasheia senha, define defaults e emite user.created', async () => {
      userRepository.countAll.mockResolvedValue(0);
      userRepository.create.mockImplementation(async (dto: any) => {
        const u = new User();
        Object.assign(u, dto);
        u.id = 'u1';
        return u;
      });

      const result = await service.create({
        name: 'N',
        email: 'new@test.local',
        password: 'plain123',
      } as any);

      expect(result.id).toBe('u1');
      expect(result.password).not.toBe('plain123');
      const ok = await bcrypt.compare('plain123', result.password);
      expect(ok).toBe(true);
      expect(result.family).toBe('');
      expect(result.coatOfArms).toContain('brasao');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'user.created',
        expect.any(Object),
      );
    });
  });

  describe('findAndValidateOwnership', () => {
    it('lança Forbidden quando ids diferem', async () => {
      await expect(
        service.findAndValidateOwnership('a', 'b'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lança NotExist quando usuário não existe', async () => {
      userRepository.find.mockResolvedValue(null);

      await expect(
        service.findAndValidateOwnership('same', 'same'),
      ).rejects.toBeInstanceOf(NotExistException);
    });
  });

  describe('update', () => {
    it('lança UpdateException quando usuário não encontrado', async () => {
      userRepository.find.mockResolvedValue(null);

      await expect(
        service.update('id', { email: 'x@test.local' } as any),
      ).rejects.toBeInstanceOf(UpdateException);
    });

    it('incrementa tokenVersion e limpa tokens ao trocar a senha', async () => {
      const u = new User();
      u.id = 'id1';
      u.tokenVersion = 2;
      u.token = 'access';
      u.refreshtoken = 'refresh';
      userRepository.find.mockResolvedValue(u);
      userRepository.update.mockImplementation(async (user, dto) =>
        Object.assign(user, dto),
      );

      await service.update('id1', { password: 'nova-senha-1' });

      expect(u.tokenVersion).toBe(3);
      expect(u.token).toBeNull();
      expect(u.refreshtoken).toBeNull();
      expect(userRepository.update).toHaveBeenCalled();
    });

    it('lança EmailAlreadyExistsException quando email já usado', async () => {
      const u = new User();
      u.id = 'id1';
      userRepository.find.mockResolvedValue(u);
      userRepository.exist.mockResolvedValue(true);

      await expect(
        service.update('id1', { email: 'taken@test.local' } as any),
      ).rejects.toBeInstanceOf(EmailAlreadyExistsException);
    });
  });

  describe('searchByEmail', () => {
    it('lança ForbiddenException quando o solicitante não é admin de grupo', async () => {
      familyMemberResolver.isAdminOfAnyGroup.mockResolvedValue(false);

      await expect(
        service.searchByEmail('user-1', 'abc'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(userRepository.searchByEmailPrefix).not.toHaveBeenCalled();
    });

    it('retorna resultados limitados quando o solicitante é admin', async () => {
      const users = [
        { id: 'u2', name: 'Ana', email: 'ana@test.local' },
      ] as User[];
      userRepository.searchByEmailPrefix.mockResolvedValue(users);

      const result = await service.searchByEmail('admin-1', 'ana');

      expect(familyMemberResolver.isAdminOfAnyGroup).toHaveBeenCalledWith(
        'admin-1',
      );
      expect(userRepository.searchByEmailPrefix).toHaveBeenCalledWith(
        'ana',
        10,
      );
      expect(result).toEqual(users);
    });
  });

  describe('delete', () => {
    async function userWithPassword(password: string): Promise<User> {
      const u = new User();
      u.id = 'u1';
      u.password = await bcrypt.hash(password, 4);
      u.tokenVersion = 1;
      u.token = 'access';
      u.refreshtoken = 'refresh';
      return u;
    }

    it('exige senha correta, invalida sessão e faz soft-delete', async () => {
      const user = await userWithPassword('secret12');
      userRepository.find.mockResolvedValue(user);
      userRepository.delete.mockResolvedValue(true);

      const result = await service.delete('u1', 'secret12');

      expect(result).toBe(true);
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(userRepository.invalidateSession).toHaveBeenCalledWith(
        'u1',
        txManager,
      );
      expect(txManager.getRepository).toHaveBeenCalledWith(PasswordResetToken);
      expect(
        familyMemberResolver.softDeleteMembershipsForUser,
      ).toHaveBeenCalledWith('u1', txManager);
      expect(userRepository.delete).toHaveBeenCalledWith('u1', txManager);
      expect(eventEmitter.emit).toHaveBeenCalledWith('user.deleted', {
        userId: 'u1',
      });
    });

    it('lança InvalidPasswordException quando a senha está incorreta', async () => {
      const user = await userWithPassword('secret12');
      userRepository.find.mockResolvedValue(user);

      await expect(service.delete('u1', 'wrong')).rejects.toBeInstanceOf(
        InvalidPasswordException,
      );
      expect(userRepository.delete).not.toHaveBeenCalled();
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('lança FamilyGroupOwnerCannotDeleteException quando é o criador do grupo', async () => {
      const user = await userWithPassword('secret12');
      userRepository.find.mockResolvedValue(user);
      familyMemberResolver.isOwnerOfAnyActiveGroup.mockResolvedValue(true);

      await expect(service.delete('u1', 'secret12')).rejects.toBeInstanceOf(
        FamilyGroupOwnerCannotDeleteException,
      );
      expect(userRepository.delete).not.toHaveBeenCalled();
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('lança LastFamilyGroupAdminException quando é o único admin', async () => {
      const user = await userWithPassword('secret12');
      userRepository.find.mockResolvedValue(user);
      familyMemberResolver.isSoleAcceptedAdminOfAnyGroup.mockResolvedValue(
        true,
      );

      await expect(service.delete('u1', 'secret12')).rejects.toBeInstanceOf(
        LastFamilyGroupAdminException,
      );
      expect(userRepository.delete).not.toHaveBeenCalled();
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });
});
