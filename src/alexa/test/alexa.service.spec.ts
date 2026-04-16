import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AlexaService } from '../alexa.service';
import { ShoppingListService } from '../../shopping-list/shopping-list.service';
import { UserService } from '../../user/user.service';

describe('AlexaService', () => {
  let service: AlexaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlexaService,
        { provide: ShoppingListService, useValue: {} },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        { provide: UserService, useValue: { find: jest.fn() } },
      ],
    }).compile();

    service = module.get(AlexaService);
  });

  it('handleIntent lança Unauthorized quando não há accessToken', async () => {
    await expect(
      service.handleIntent({
        session: {},
        request: { type: 'IntentRequest', intent: { name: 'AddItemIntent' } },
      } as any),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
