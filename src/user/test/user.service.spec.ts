import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { EventEmitter } from 'events';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user.service';
import { IUserRepository } from '../interfaces/user.repository.interface';
import { AppConfig } from '../../common/app-config/app.config';
import { EVENT_EMITTER } from '../../common/event-emitter/event-emitter.provider';
import { User } from '../entities/user.entity';
import { AlreadyExistsException } from '../../exception/alreadyExistsException';
import { NotExistException } from '../../exception/notExistException';
import { UpdateException } from '../../exception/updateException';
import { createAppConfigMock } from '../../common/test/app-config.mock';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<IUserRepository>;
  let eventEmitter: EventEmitter;

  beforeEach(async () => {
    userRepository = {
      countAll: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
      findByEmail: jest.fn(),
      saveToken: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      remove: jest.fn(),
      exist: jest.fn(),
      saveRefreshToken: jest.fn(),
      findByRefreshToken: jest.fn(),
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
      ],
    }).compile();

    service = module.get(UserService);
  });

  describe('create', () => {
    it('lança ConflictException quando limite de usuários é atingido', async () => {
      userRepository.countAll.mockResolvedValue(15);

      await expect(
        service.create({
          name: 'A',
          email: 'a@test.local',
          password: 'secret',
        } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('hasheia senha, define defaults e emite user.created', async () => {
      userRepository.countAll.mockResolvedValue(0);
      const saved = new User();
      saved.id = 'u1';
      saved.email = 'new@test.local';
      userRepository.create.mockImplementation(async (dto: any) => {
        const u = new User();
        Object.assign(u, dto);
        u.id = 'u1';
        return u;
      });

      const result = await service.create({
        name: 'N',
        email: 'new@test.local',
        password: 'plain',
      } as any);

      expect(result.id).toBe('u1');
      expect(result.password).not.toBe('plain');
      const ok = await bcrypt.compare('plain', result.password);
      expect(ok).toBe(true);
      expect(result.family).toBe('N');
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

    it('lança AlreadyExistsException quando email já usado', async () => {
      const u = new User();
      u.id = 'id1';
      userRepository.find.mockResolvedValue(u);
      userRepository.exist.mockResolvedValue(true);

      await expect(
        service.update('id1', { email: 'taken@test.local' } as any),
      ).rejects.toBeInstanceOf(AlreadyExistsException);
    });
  });
});
