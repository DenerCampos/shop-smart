import { ChatToolsService } from '../tools/chat-tools.service';
import { ChatAuthContext } from '../types/chat-auth-context.type';
import { User } from 'src/user/entities/user.entity';

describe('ChatToolsService ACL', () => {
  const adminUser = { id: 'admin-1', name: 'Admin' } as User;
  const memberUser = { id: 'member-1', name: 'Member' } as User;

  const adminCtx: ChatAuthContext = {
    user: adminUser,
    isAdmin: true,
    groupId: 'group-1',
    financialUserIds: ['admin-1', 'member-1'],
    groupMemberUserIds: ['admin-1', 'member-1'],
  };

  const memberCtx: ChatAuthContext = {
    user: memberUser,
    isAdmin: false,
    groupId: 'group-1',
    financialUserIds: ['member-1'],
    groupMemberUserIds: ['admin-1', 'member-1'],
  };

  const familyGroupService = {
    getMembers: jest.fn().mockResolvedValue([
      {
        id: 'm1',
        user: { id: 'admin-1', name: 'Admin' },
        role: 'admin',
        status: 'accepted',
        invitedEmail: 'a@a.com',
      },
      {
        id: 'm2',
        user: { id: 'member-1', name: 'Member' },
        role: 'member',
        status: 'accepted',
        invitedEmail: 'm@m.com',
      },
    ]),
  };

  const expenseService = {
    find: jest.fn(),
    getReceipt: jest.fn(),
    mapForResponse: jest.fn(),
  };

  const service = new ChatToolsService(
    expenseService as never,
    {} as never,
    {} as never,
    familyGroupService as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('member não acessa despesa de outro usuário', async () => {
    expenseService.find.mockResolvedValue({
      id: 'exp-1',
      user: { id: 'admin-1' },
    });

    const result = await service.execute(
      'get_expense',
      { id: 'exp-1' },
      memberCtx,
    );

    expect(result).toEqual(
      expect.objectContaining({
        error: expect.stringMatching(/permissão|Sem permissão/i),
      }),
    );
  });

  it('admin acessa despesa de membro da família', async () => {
    expenseService.find.mockResolvedValue({
      id: 'exp-1',
      user: { id: 'member-1' },
      name: 'Mercado',
    });
    expenseService.mapForResponse.mockResolvedValue({ id: 'exp-1' });

    const result = await service.execute(
      'get_expense',
      { id: 'exp-1' },
      adminCtx,
    );

    expect(expenseService.mapForResponse).toHaveBeenCalled();
    expect(result).toEqual({ id: 'exp-1' });
  });

  it('admin obtém receipt de despesa do membro via ACL financeiro', async () => {
    expenseService.find.mockResolvedValue({
      id: 'exp-1',
      user: { id: 'member-1' },
    });
    expenseService.getReceipt.mockResolvedValue({
      id: 'exp-1',
      type: 'expense',
      name: 'Mercado',
      value: 10,
      uri: 'https://storage.example/secret.pdf',
      photos: [{ id: 'p1', url: 'https://storage.example/p1.jpg' }],
      store: { id: 's1', name: 'Loja' },
      payment: { id: 'pay1', name: 'Pix' },
      items: [{ id: 'i1', name: 'Arroz', value: 10, quantity: 1 }],
      user: { id: 'member-1', name: 'Member', password: 'hash' },
    });

    const result = await service.execute(
      'get_expense_receipt',
      { id: 'exp-1' },
      adminCtx,
    );

    expect(expenseService.getReceipt).toHaveBeenCalledWith('exp-1', 'member-1');
    expect(result).toEqual({
      id: 'exp-1',
      type: 'expense',
      name: 'Mercado',
      value: 10,
      installmentValue: undefined,
      totalValue: undefined,
      date: undefined,
      isInstallmentRoot: undefined,
      installment: undefined,
      store: { id: 's1', name: 'Loja' },
      payment: { id: 'pay1', name: 'Pix' },
      items: [
        {
          id: 'i1',
          name: 'Arroz',
          value: 10,
          quantity: 1,
          group: null,
        },
      ],
      user: { id: 'member-1', name: 'Member' },
      photoCount: 1,
      hasAttachedFile: true,
    });
    expect(result).not.toHaveProperty('uri');
    expect(result).not.toHaveProperty('photos');
  });

  it('member não obtém receipt de despesa alheia', async () => {
    expenseService.find.mockResolvedValue({
      id: 'exp-1',
      user: { id: 'admin-1' },
    });

    const result = await service.execute(
      'get_expense_receipt',
      { id: 'exp-1' },
      memberCtx,
    );

    expect(expenseService.getReceipt).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        error: expect.stringMatching(/permissão|Sem permissão/i),
      }),
    );
  });

  it('sanitize remove password de get_expense', async () => {
    expenseService.find.mockResolvedValue({
      id: 'exp-1',
      user: { id: 'member-1' },
    });
    expenseService.mapForResponse.mockResolvedValue({
      id: 'exp-1',
      user: {
        id: 'member-1',
        name: 'Member',
        password: 'hash',
        token: 't',
      },
    });

    const result = await service.execute(
      'get_expense',
      { id: 'exp-1' },
      adminCtx,
    );

    expect(result).toEqual({
      id: 'exp-1',
      user: { id: 'member-1', name: 'Member' },
    });
  });

  it('member não resolve memberName financeiro de outro', async () => {
    const result = await service.execute(
      'get_coin_balance',
      { memberName: 'Admin' },
      memberCtx,
    );
    expect(result).toEqual(
      expect.objectContaining({
        error: expect.any(String),
      }),
    );
  });
});
