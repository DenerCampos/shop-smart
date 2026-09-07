import { ChatToolsService } from '../tools/chat-tools.service';
import { ChatAuthContext } from '../types/chat-auth-context.type';
import { User } from 'src/user/entities/user.entity';
import { getLast12MonthsDates } from 'src/common/utils/dates.util';

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
    searchItems: jest.fn(),
    findAll: jest.fn(),
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

    expect(expenseService.getReceipt).toHaveBeenCalledWith('exp-1', 'admin-1');
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

describe('ChatToolsService search_expense_items período (SP-139)', () => {
  const adminUser = { id: 'admin-1', name: 'Admin' } as User;
  const adminCtx: ChatAuthContext = {
    user: adminUser,
    isAdmin: true,
    groupId: 'group-1',
    financialUserIds: ['admin-1', 'member-1'],
    groupMemberUserIds: ['admin-1', 'member-1'],
  };

  const expenseService = {
    find: jest.fn(),
    getReceipt: jest.fn(),
    mapForResponse: jest.fn(),
    searchItems: jest.fn().mockResolvedValue([
      {
        expenseId: 'e1',
        expenseName: 'Mercado',
        date: new Date('2026-07-18'),
        store: 'BH',
        itemName: 'Desinfetante UAU 2L',
        quantity: 1,
        unit: 'unidade',
        total: 7.9,
        category: 'Limpeza',
        userId: 'admin-1',
      },
    ]),
    findAll: jest.fn(),
  };

  const service = new ChatToolsService(
    expenseService as never,
    {} as never,
    {} as never,
    { getMembers: jest.fn() } as never,
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

  it('sem datas aplica últimos 12 meses e devolve period', async () => {
    const range = getLast12MonthsDates();
    const result = (await service.execute(
      'search_expense_items',
      { name: 'UAU', category: 'Limpeza' },
      adminCtx,
    )) as {
      count: number;
      period: { scope: string; from: string; to: string; label: string };
    };

    expect(expenseService.searchItems).toHaveBeenCalledWith({
      userIds: ['admin-1', 'member-1'],
      name: 'UAU',
      category: 'Limpeza',
      store: undefined,
      from: range.startDateString,
      to: range.endDateString,
      limit: 100,
    });
    expect(result.count).toBe(1);
    expect(result.period.scope).toBe('last_12_months');
    expect(result.period.from).toBe(range.startDateString);
    expect(result.period.label).toContain('últimos 12 meses');
  });

  it('com lastN não passa intervalo do mês atual', async () => {
    const result = (await service.execute(
      'search_expense_items',
      { category: 'Limpeza', lastN: 20 },
      adminCtx,
    )) as {
      period: { scope: string; from: null; label: string; limit: number };
    };

    expect(expenseService.searchItems).toHaveBeenCalledWith({
      userIds: ['admin-1', 'member-1'],
      name: undefined,
      category: 'Limpeza',
      store: undefined,
      from: null,
      to: null,
      limit: 20,
    });
    expect(result.period.scope).toBe('all_time');
    expect(result.period.from).toBeNull();
    expect(result.period.label).toBe('busquei em toda a base (últimos 20)');
  });
});

describe('ChatToolsService summarize_expenses ignora lastN (SP-139)', () => {
  const adminUser = { id: 'admin-1', name: 'Admin' } as User;
  const adminCtx: ChatAuthContext = {
    user: adminUser,
    isAdmin: true,
    groupId: 'group-1',
    financialUserIds: ['admin-1', 'member-1'],
    groupMemberUserIds: ['admin-1', 'member-1'],
  };

  const reportsService = {
    expenseByGroup: jest
      .fn()
      .mockResolvedValue([{ name: 'Limpeza', total: 10 }]),
    expenseByStore: jest.fn(),
  };

  const service = new ChatToolsService(
    {
      find: jest.fn(),
      getReceipt: jest.fn(),
      mapForResponse: jest.fn(),
      searchItems: jest.fn(),
      findAll: jest.fn(),
    } as never,
    {} as never,
    reportsService as never,
    { getMembers: jest.fn() } as never,
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

  it('com lastN ainda usa últimos 12 meses e chama o relatório com from/to', async () => {
    const range = getLast12MonthsDates();
    const result = (await service.execute(
      'summarize_expenses',
      { lastN: 20, groupBy: 'category' },
      adminCtx,
    )) as {
      period: { scope: string; from: string; to: string };
      error?: string;
    };

    expect(result.error).toBeUndefined();
    expect(result.period.scope).toBe('last_12_months');
    expect(reportsService.expenseByGroup).toHaveBeenCalledWith(
      adminUser,
      expect.objectContaining({
        startDate: range.startDateString,
        endDate: range.endDateString,
      }),
    );
  });
});
