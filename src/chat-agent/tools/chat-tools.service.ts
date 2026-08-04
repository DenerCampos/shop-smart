import { ForbiddenException, Injectable } from '@nestjs/common';
import { ChatAuthContext } from '../types/chat-auth-context.type';
import { ExpenseService } from 'src/expense/expense.service';
import { RevenueService } from 'src/revenue/revenue.service';
import { ReportsService } from 'src/reports/reports.service';
import { FamilyGroupService } from 'src/family-group/family-group.service';
import { ShoppingListService } from 'src/shopping-list/shopping-list.service';
import { ChoreService } from 'src/chore/chore.service';
import { CoinService } from 'src/coin/coin.service';
import { MissionService } from 'src/mission/mission.service';
import { HealthService } from 'src/health/health.service';
import { RecipeService } from 'src/recipe/recipe.service';
import { StoreService } from 'src/store/store.service';
import { PaymentService } from 'src/payment/payment.service';
import { GroupService } from 'src/group/group.service';
import { ThemeService } from 'src/theme/theme.service';
import { ProfileService } from 'src/profile/profile.service';
import { ApiQuotaService } from 'src/common/ai-quota/services/apiQuota.service';
import { AppConfig } from 'src/common/app-config/app.config';
import { getCurrentMonthDates } from 'src/common/utils/dates.util';
import { User } from 'src/user/entities/user.entity';
import { ChatToolForbiddenException } from '../exceptions/chat-agent.exception';
import { sanitizeChatToolResult } from '../utils/sanitize-chat-tool-result';

type Args = Record<string, unknown>;

@Injectable()
export class ChatToolsService {
  constructor(
    private readonly expenseService: ExpenseService,
    private readonly revenueService: RevenueService,
    private readonly reportsService: ReportsService,
    private readonly familyGroupService: FamilyGroupService,
    private readonly shoppingListService: ShoppingListService,
    private readonly choreService: ChoreService,
    private readonly coinService: CoinService,
    private readonly missionService: MissionService,
    private readonly healthService: HealthService,
    private readonly recipeService: RecipeService,
    private readonly storeService: StoreService,
    private readonly paymentService: PaymentService,
    private readonly groupService: GroupService,
    private readonly themeService: ThemeService,
    private readonly profileService: ProfileService,
    private readonly apiQuotaService: ApiQuotaService,
    private readonly appConfig: AppConfig,
  ) {}

  async execute(
    name: string,
    args: Args,
    ctx: ChatAuthContext,
  ): Promise<unknown> {
    const handlers: Record<
      string,
      (a: Args, c: ChatAuthContext) => Promise<unknown>
    > = {
      get_current_user: (_a, c) => this.getCurrentUser(c),
      list_family_members: (_a, c) => this.listFamilyMembers(c),
      list_pending_invitations: (_a, c) => this.listPendingInvitations(c),
      get_family_summary: (a, c) => this.getFamilySummary(a, c),
      list_latest_registrations: (a, c) => this.listLatestRegistrations(a, c),
      list_expenses: (a, c) => this.listExpenses(a, c),
      search_expense_items: (a, c) => this.searchExpenseItems(a, c),
      summarize_expenses: (a, c) => this.summarizeExpenses(a, c),
      get_expense: (a, c) => this.getExpense(a, c),
      get_expense_receipt: (a, c) => this.getExpenseReceipt(a, c),
      list_revenues: (a, c) => this.listRevenues(a, c),
      summarize_revenues: (a, c) => this.summarizeRevenues(a, c),
      get_revenue: (a, c) => this.getRevenue(a, c),
      get_month_balance: (a, c) => this.getMonthBalance(a, c),
      list_pending_recurring: (a, c) => this.listPendingRecurring(a, c),
      list_stores: (_a, c) => this.listStores(c),
      list_categories: (_a, c) => this.listCategories(c),
      list_payments: (_a, c) => this.listPayments(c),
      report_expense_by_category: (a, c) => this.report(a, c, 'expenseByGroup'),
      report_expense_by_store: (a, c) => this.report(a, c, 'expenseByStore'),
      report_expense_by_date: (a, c) => this.report(a, c, 'expenseByDate'),
      report_most_purchased_items: (a, c) =>
        this.report(a, c, 'mostPurchasedItems'),
      report_expenses_vs_income: (a, c) => this.reportExpensesVsIncome(a, c),
      list_warranties: (a, c) => this.listWarranties(a, c),
      list_shopping_lists: (a, c) => this.listShoppingLists(a, c),
      get_shopping_list: (a, c) => this.getShoppingList(a, c),
      search_shopping_suggestions: (a, c) =>
        this.searchShoppingSuggestions(a, c),
      list_chore_definitions: (_a, c) => this.listChoreDefinitions(c),
      search_chores: (a, c) => this.searchChores(a, c),
      list_pending_approvals: (_a, c) => this.listPendingApprovals(c),
      get_payroll_pending: (a, c) => this.getPayrollPending(a, c),
      get_payroll_settlement: (a, c) => this.getPayrollSettlement(a, c),
      get_coin_balance: (a, c) => this.getCoinBalance(a, c),
      get_coin_statement: (a, c) => this.getCoinStatement(a, c),
      list_missions: (_a, c) => this.listMissions(c),
      list_themes: (_a, c) => this.listThemes(c),
      list_health_exams: (a, c) => this.listHealthExams(a, c),
      get_lab_item_evolution: (a, c) => this.getLabItemEvolution(a, c),
      list_prescriptions: (a, c) => this.listPrescriptions(a, c),
      get_medication_schedule: (a, c) => this.getMedicationSchedule(a, c),
      get_health_ai_overview: (a, c) => this.getHealthAiOverview(a, c),
      list_recipes: (a, c) => this.listRecipes(a, c),
      get_recipe: (a, c) => this.getRecipe(a, c),
      get_alexa_status: (_a, c) => this.getAlexaStatus(c),
      get_ai_quota: (_a, c) => this.getAiQuota(c),
    };

    const handler = handlers[name];
    if (!handler) {
      return { error: `Tool desconhecida: ${name}` };
    }

    try {
      const result = await handler(args ?? {}, ctx);
      return sanitizeChatToolResult(result);
    } catch (err) {
      if (
        err instanceof ForbiddenException ||
        err instanceof ChatToolForbiddenException
      ) {
        return { error: err.message || 'Sem permissão' };
      }
      const message = err instanceof Error ? err.message : String(err);
      return { error: message };
    }
  }

  private async getCurrentUser(ctx: ChatAuthContext) {
    const u = ctx.user;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      family: u.family,
      coatOfArms: u.coatOfArms,
      profileImage: u.profileImage,
      isAdmin: ctx.isAdmin,
      groupId: ctx.groupId,
    };
  }

  private async listFamilyMembers(ctx: ChatAuthContext) {
    if (!ctx.groupId) {
      return { members: [], note: 'Usuário sem grupo familiar.' };
    }
    const members = await this.familyGroupService.getMembers(
      ctx.groupId,
      ctx.user.id,
    );
    return {
      members: members.map((m) => ({
        memberId: m.id,
        userId: m.user?.id ?? null,
        name: m.user?.name ?? null,
        email: m.invitedEmail,
        role: m.role,
        status: m.status,
      })),
    };
  }

  private async listPendingInvitations(ctx: ChatAuthContext) {
    const rows = await this.familyGroupService.getPendingInvitations(ctx.user);
    return {
      invitations: rows.map((m) => ({
        id: m.id,
        groupName: m.familyGroup?.name,
        role: m.role,
        status: m.status,
      })),
    };
  }

  private async getFamilySummary(args: Args, ctx: ChatAuthContext) {
    if (!ctx.groupId) {
      return { error: 'Usuário sem grupo familiar.' };
    }
    const month = Number(args.month);
    const year = Number(args.year);
    return this.familyGroupService.getGroupSummary(
      ctx.groupId,
      ctx.user.id,
      month,
      year,
    );
  }

  private async listLatestRegistrations(args: Args, ctx: ChatAuthContext) {
    const page = Number(args.page) || 1;
    const limit = Number(args.limit) || 10;
    return this.profileService.getLatestRegistrations(ctx.user, page, limit);
  }

  private async resolveMemberUserId(
    memberName: unknown,
    ctx: ChatAuthContext,
    mode: 'financial' | 'group',
  ): Promise<string | undefined> {
    if (memberName == null || memberName === '') return undefined;
    const name = String(memberName).trim().toLowerCase();
    if (name === 'all' || name === 'todos') {
      if (!ctx.isAdmin) {
        throw new ChatToolForbiddenException(
          'Apenas admin pode consultar todos os membros.',
        );
      }
      return 'all';
    }

    if (!ctx.groupId) {
      throw new ChatToolForbiddenException('Sem grupo para resolver membro.');
    }

    const members = await this.familyGroupService.getMembers(
      ctx.groupId,
      ctx.user.id,
    );
    const match = members.find(
      (m) => m.user?.name?.toLowerCase().includes(name) && m.user?.id,
    );
    if (!match?.user?.id) {
      throw new ChatToolForbiddenException(
        `Membro não encontrado: ${String(memberName)}`,
      );
    }

    const targetId = match.user.id;
    const allowed =
      mode === 'financial' ? ctx.financialUserIds : ctx.groupMemberUserIds;
    if (!allowed.includes(targetId) && !(ctx.isAdmin && mode === 'group')) {
      if (!ctx.isAdmin && targetId !== ctx.user.id) {
        throw new ChatToolForbiddenException(
          'Você só pode consultar os próprios dados neste domínio.',
        );
      }
    }
    if (mode === 'financial' && !ctx.financialUserIds.includes(targetId)) {
      throw new ChatToolForbiddenException(
        'Sem permissão para dados financeiros deste membro.',
      );
    }
    return targetId;
  }

  private asUserFor(userId: string, ctx: ChatAuthContext): User {
    if (userId === ctx.user.id) return ctx.user;
    const proxy = Object.create(ctx.user) as User;
    proxy.id = userId;
    return proxy;
  }

  private period(args: Args): { from: string; to: string } {
    const { startDateString, endDateString } = getCurrentMonthDates();
    return {
      from: String(args.from || startDateString).slice(0, 10),
      to: String(args.to || endDateString).slice(0, 10),
    };
  }

  private async listExpenses(args: Args, ctx: ChatAuthContext) {
    const memberId = await this.resolveMemberUserId(
      args.memberName,
      ctx,
      'financial',
    );
    const user =
      memberId && memberId !== 'all' ? this.asUserFor(memberId, ctx) : ctx.user;
    const page = await this.expenseService.findAll(
      {
        page: Number(args.page) || 1,
        limit: Number(args.limit) || 20,
        search: args.search ? String(args.search) : undefined,
        isRecurring:
          args.isRecurring === undefined
            ? undefined
            : Boolean(args.isRecurring),
        isInstallment:
          args.isInstallment === undefined
            ? undefined
            : Boolean(args.isInstallment),
      },
      user,
    );
    return {
      total: page.meta.totalItems,
      items: page.data.map((e) => ({
        id: e.id,
        name: e.name,
        value: e.value,
        date: e.date,
        store: e.store?.name,
        userId: e.user?.id,
        userName: e.user?.name,
        itemsCount: e.items?.length ?? 0,
      })),
    };
  }

  private async searchExpenseItems(args: Args, ctx: ChatAuthContext) {
    const { from, to } = this.period(args);
    const memberId = await this.resolveMemberUserId(
      args.memberName,
      ctx,
      'financial',
    );
    const userIds =
      memberId === 'all'
        ? ctx.financialUserIds
        : memberId
          ? [memberId]
          : ctx.financialUserIds;

    const nameQ = args.name ? String(args.name).toLowerCase() : '';
    const catQ = args.category ? String(args.category).toLowerCase() : '';
    const storeQ = args.store ? String(args.store).toLowerCase() : '';

    const expenseLimit = 100;
    const itemLimit = 100;
    const expenses = await this.expenseService.findByPeriodWithItems(
      userIds,
      from,
      to,
      expenseLimit,
    );

    const collected: Array<Record<string, unknown>> = [];
    for (const exp of expenses) {
      const storeName = exp.store?.name?.toLowerCase() ?? '';
      if (storeQ && !storeName.includes(storeQ)) continue;
      for (const item of exp.items ?? []) {
        const itemName = item.name?.toLowerCase() ?? '';
        const groupName = item.group?.name?.toLowerCase() ?? '';
        if (nameQ && !itemName.includes(nameQ)) continue;
        if (catQ && !groupName.includes(catQ)) continue;
        collected.push({
          expenseId: exp.id,
          expenseName: exp.name,
          date: exp.date,
          store: exp.store?.name,
          itemName: item.name,
          quantity: item.quantity,
          unit: item.unit,
          total: item.total,
          category: item.group?.name,
          userId: exp.user?.id,
        });
        if (collected.length >= itemLimit) break;
      }
      if (collected.length >= itemLimit) break;
    }
    return {
      count: collected.length,
      items: collected,
      truncated:
        expenses.length >= expenseLimit || collected.length >= itemLimit,
    };
  }

  private async summarizeExpenses(args: Args, ctx: ChatAuthContext) {
    const { from, to } = this.period(args);
    const memberId = await this.resolveMemberUserId(
      args.memberName,
      ctx,
      'financial',
    );
    const reportUserId = memberId === 'all' ? 'all' : memberId || ctx.user.id;
    const groupBy = String(args.groupBy || 'category');
    if (groupBy === 'store' || args.store) {
      const data = await this.reportsService.expenseByStore(ctx.user, {
        startDate: from,
        endDate: to,
        userId: reportUserId,
      });
      if (args.store) {
        const q = String(args.store).toLowerCase();
        return {
          data: (Array.isArray(data) ? data : []).filter(
            (row: { name?: string }) => row.name?.toLowerCase().includes(q),
          ),
        };
      }
      return { data };
    }
    const data = await this.reportsService.expenseByGroup(ctx.user, {
      startDate: from,
      endDate: to,
      userId: reportUserId,
    });
    if (args.category) {
      const q = String(args.category).toLowerCase();
      return {
        data: (Array.isArray(data) ? data : []).filter(
          (row: { name?: string }) => row.name?.toLowerCase().includes(q),
        ),
      };
    }
    return { data };
  }

  private async getExpense(args: Args, ctx: ChatAuthContext) {
    const id = String(args.id);
    const expense = await this.expenseService.find(id);
    if (!expense) return { error: 'Despesa não encontrada' };
    if (!ctx.financialUserIds.includes(expense.user.id)) {
      throw new ChatToolForbiddenException();
    }
    return this.expenseService.mapForResponse(expense);
  }

  private async getExpenseReceipt(args: Args, ctx: ChatAuthContext) {
    const id = String(args.id);
    const expense = await this.expenseService.find(id);
    if (!expense) return { error: 'Despesa não encontrada' };
    if (!ctx.financialUserIds.includes(expense.user.id)) {
      throw new ChatToolForbiddenException();
    }
    // getReceipt exige o dono da despesa; admin já passou pelo ACL financeiro.
    // Não enviar uri/photos ao Gemini — só resumo textual.
    const receipt = await this.expenseService.getReceipt(id, expense.user.id);
    return this.mapReceiptForChat(receipt);
  }

  private mapReceiptForChat(receipt: {
    id: string;
    type: string;
    name?: string;
    value?: number;
    installmentValue?: number;
    totalValue?: number;
    date?: Date | string;
    isInstallmentRoot?: boolean;
    installment?: {
      installmentNumber?: number;
      totalInstallments?: number;
      isInstallment?: boolean;
      installmentLabel?: string;
    };
    store?: { id?: string; name?: string } | null;
    payment?: { id?: string; name?: string } | null;
    items?: Array<{
      id?: string;
      name?: string;
      value?: number;
      quantity?: number;
      group?: { id?: string; name?: string } | null;
    }>;
    user?: { id?: string; name?: string } | null;
    photos?: unknown[];
    uri?: string;
  }) {
    return {
      id: receipt.id,
      type: receipt.type,
      name: receipt.name,
      value: receipt.value,
      installmentValue: receipt.installmentValue,
      totalValue: receipt.totalValue,
      date: receipt.date,
      isInstallmentRoot: receipt.isInstallmentRoot,
      installment: receipt.installment
        ? {
            installmentNumber: receipt.installment.installmentNumber,
            totalInstallments: receipt.installment.totalInstallments,
            isInstallment: receipt.installment.isInstallment,
            installmentLabel: receipt.installment.installmentLabel,
          }
        : undefined,
      store: receipt.store
        ? { id: receipt.store.id, name: receipt.store.name }
        : null,
      payment: receipt.payment
        ? { id: receipt.payment.id, name: receipt.payment.name }
        : null,
      items: (receipt.items ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        value: item.value,
        quantity: item.quantity,
        group: item.group
          ? { id: item.group.id, name: item.group.name }
          : null,
      })),
      user: receipt.user
        ? { id: receipt.user.id, name: receipt.user.name }
        : null,
      photoCount: Array.isArray(receipt.photos) ? receipt.photos.length : 0,
      hasAttachedFile: Boolean(receipt.uri),
    };
  }

  private async listRevenues(args: Args, ctx: ChatAuthContext) {
    const memberId = await this.resolveMemberUserId(
      args.memberName,
      ctx,
      'financial',
    );
    const user =
      memberId && memberId !== 'all' ? this.asUserFor(memberId, ctx) : ctx.user;
    const page = await this.revenueService.findAll(
      {
        page: Number(args.page) || 1,
        limit: Number(args.limit) || 20,
        search: args.search ? String(args.search) : undefined,
      },
      user,
    );
    return {
      total: page.meta.totalItems,
      items: page.data.map((r) => ({
        id: r.id,
        name: r.name,
        value: r.value,
        date: r.date,
        userId: r.user?.id,
        userName: r.user?.name,
      })),
    };
  }

  private async summarizeRevenues(args: Args, ctx: ChatAuthContext) {
    const { from, to } = this.period(args);
    const memberId = await this.resolveMemberUserId(
      args.memberName,
      ctx,
      'financial',
    );
    const userIds =
      memberId === 'all'
        ? ctx.financialUserIds
        : memberId
          ? [memberId]
          : [ctx.user.id];
    let total = 0;
    const rows: Array<{ userId: string; value: number }> = [];
    for (const uid of userIds) {
      const revenues = await this.revenueService.getByPeriod(uid, from, to);
      const value = (revenues || []).reduce(
        (s, r) => s + Number(r.value || 0),
        0,
      );
      total += value;
      rows.push({ userId: uid, value });
    }
    return { from, to, total, byUser: rows };
  }

  private async getRevenue(args: Args, ctx: ChatAuthContext) {
    const revenue = await this.revenueService.find(String(args.id));
    if (!revenue) return { error: 'Receita não encontrada' };
    if (!ctx.financialUserIds.includes(revenue.user.id)) {
      throw new ChatToolForbiddenException();
    }
    return this.revenueService.mapForResponse(revenue);
  }

  private async getMonthBalance(args: Args, ctx: ChatAuthContext) {
    const now = new Date();
    const month = Number(args.month) || now.getMonth() + 1;
    const year = Number(args.year) || now.getFullYear();
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const startDateString = start.toISOString().slice(0, 10);
    const endDateString = end.toISOString().slice(0, 10);
    const memberId = await this.resolveMemberUserId(
      args.memberName,
      ctx,
      'financial',
    );
    const userIds =
      memberId === 'all'
        ? ctx.financialUserIds
        : memberId
          ? [memberId]
          : [ctx.user.id];

    let expenses = 0;
    let revenues = 0;
    for (const uid of userIds) {
      const exp = await this.expenseService.getByPeriod(
        uid,
        startDateString,
        endDateString,
      );
      expenses += exp.reduce((s, e) => s + Number(e.value || 0), 0);
      const rev = await this.revenueService.getByPeriod(
        uid,
        startDateString,
        endDateString,
      );
      revenues += rev.reduce((s, r) => s + Number(r.value || 0), 0);
    }
    return {
      month,
      year,
      expenses,
      revenues,
      balance: revenues - expenses,
    };
  }

  private async listPendingRecurring(args: Args, ctx: ChatAuthContext) {
    const type = String(args.type || 'both');
    const result: Record<string, unknown> = {};
    if (type === 'expense' || type === 'both') {
      const expenses =
        await this.expenseService.getRecurringExpenseByCurrentMonth(ctx.user);
      result.expenses = (expenses || []).map((e) => ({
        id: e.id,
        name: e.name,
        value: e.value,
        date: e.date,
      }));
    }
    if (type === 'revenue' || type === 'both') {
      const revenues =
        await this.revenueService.getRecurringRevenueByCurrentMonth(ctx.user);
      result.revenues = (revenues || []).map((r) => ({
        id: r.id,
        name: r.name,
        value: r.value,
        date: r.date,
      }));
    }
    return result;
  }

  private async listStores(ctx: ChatAuthContext) {
    const page = await this.storeService.findAll(
      { page: 1, limit: 50 },
      ctx.user,
    );
    return {
      items: page.data.map((s) => ({ id: s.id, name: s.name })),
    };
  }

  private async listCategories(ctx: ChatAuthContext) {
    const page = await this.groupService.findAll(
      { page: 1, limit: 50 },
      ctx.user,
    );
    return {
      items: page.data.map((g) => ({ id: g.id, name: g.name })),
    };
  }

  private async listPayments(ctx: ChatAuthContext) {
    const page = await this.paymentService.findAll(
      { page: 1, limit: 50 },
      ctx.user,
    );
    return {
      items: page.data.map((p) => ({ id: p.id, name: p.name })),
    };
  }

  private async report(
    args: Args,
    ctx: ChatAuthContext,
    kind:
      | 'expenseByGroup'
      | 'expenseByStore'
      | 'expenseByDate'
      | 'mostPurchasedItems',
  ) {
    const { from, to } = this.period(args);
    const memberId = await this.resolveMemberUserId(
      args.memberName,
      ctx,
      'financial',
    );
    const userId =
      memberId === 'all'
        ? 'all'
        : memberId || (ctx.isAdmin ? 'all' : ctx.user.id);
    const dto = { startDate: from, endDate: to, userId };
    if (kind === 'expenseByGroup') {
      return this.reportsService.expenseByGroup(ctx.user, dto);
    }
    if (kind === 'expenseByStore') {
      return this.reportsService.expenseByStore(ctx.user, dto);
    }
    if (kind === 'expenseByDate') {
      return this.reportsService.expenseByDate(ctx.user, dto);
    }
    return this.reportsService.mostPurchasedItems(ctx.user, dto);
  }

  private async reportExpensesVsIncome(args: Args, ctx: ChatAuthContext) {
    const memberId = await this.resolveMemberUserId(
      args.memberName,
      ctx,
      'financial',
    );
    return this.reportsService.expensesIncomeComparison(ctx.user, {
      year: args.year ? String(args.year) : undefined,
      userId:
        memberId === 'all'
          ? 'all'
          : memberId || (ctx.isAdmin ? 'all' : ctx.user.id),
    });
  }

  private async listWarranties(args: Args, ctx: ChatAuthContext) {
    const memberId = await this.resolveMemberUserId(
      args.memberName,
      ctx,
      'financial',
    );
    return this.reportsService.warrantyItems(ctx.user, {
      year: args.year ? String(args.year) : undefined,
      search: args.search ? String(args.search) : undefined,
      includeExpired: Boolean(args.includeExpired),
      userId:
        memberId === 'all'
          ? 'all'
          : memberId || (ctx.isAdmin ? 'all' : ctx.user.id),
      page: 1,
      limit: 50,
    });
  }

  private async listShoppingLists(args: Args, ctx: ChatAuthContext) {
    return this.shoppingListService.findAll(
      {
        page: 1,
        limit: 20,
        status: args.status
          ? (String(args.status) as 'active' | 'completed' | 'archived')
          : undefined,
      },
      ctx.user,
    );
  }

  private async getShoppingList(args: Args, ctx: ChatAuthContext) {
    const list = await this.shoppingListService.findOne(
      String(args.id),
      ctx.user,
    );
    return this.shoppingListService.toDetailResponseDto(list);
  }

  private async searchShoppingSuggestions(args: Args, ctx: ChatAuthContext) {
    return this.shoppingListService.getSuggestions(
      String(args.search),
      ctx.user,
    );
  }

  private requireGroup(ctx: ChatAuthContext): string {
    if (!ctx.groupId) {
      throw new ChatToolForbiddenException(
        'Recurso disponível apenas com grupo familiar.',
      );
    }
    return ctx.groupId;
  }

  private async listChoreDefinitions(ctx: ChatAuthContext) {
    const groupId = this.requireGroup(ctx);
    return this.choreService.listDefinitions(groupId, ctx.user, {
      page: 1,
      limit: 50,
    });
  }

  private async searchChores(args: Args, ctx: ChatAuthContext) {
    const groupId = this.requireGroup(ctx);
    const titleQuery = args.titleQuery
      ? String(args.titleQuery).toLowerCase()
      : '';
    const status = args.status ? String(args.status) : undefined;

    let page;
    if (ctx.isAdmin) {
      page = await this.choreService.listOccurrences(groupId, ctx.user, {
        page: 1,
        limit: 50,
        status: status as never,
      });
    } else {
      page = await this.choreService.listMine(groupId, ctx.user, {
        page: 1,
        limit: 50,
        status: status as never,
      });
    }

    const memberId = args.memberName
      ? await this.resolveMemberUserId(args.memberName, ctx, 'group')
      : undefined;

    const filtered = page.data.filter((occ) => {
      const title = (occ.definition?.title || '').toLowerCase();
      if (titleQuery && !title.includes(titleQuery)) return false;
      if (memberId && memberId !== 'all' && occ.assignedTo?.id !== memberId) {
        return false;
      }
      return true;
    });

    return {
      items: filtered.map((occ) => ({
        id: occ.id,
        title: occ.definition?.title,
        status: occ.status,
        assignedTo: occ.assignedTo?.name,
        completedAt: occ.completedAt,
        scheduledDate: occ.scheduledDate,
      })),
    };
  }

  private async listPendingApprovals(ctx: ChatAuthContext) {
    const groupId = this.requireGroup(ctx);
    if (!ctx.isAdmin) {
      throw new ChatToolForbiddenException('Apenas admin pode ver aprovações.');
    }
    return this.choreService.listPendingApproval(groupId, ctx.user, {
      page: 1,
      limit: 50,
    });
  }

  private async getPayrollPending(args: Args, ctx: ChatAuthContext) {
    const groupId = this.requireGroup(ctx);
    return this.choreService.getPayrollPending(
      groupId,
      ctx.user,
      {
        year: args.year ? Number(args.year) : undefined,
        month: args.month ? Number(args.month) : undefined,
      },
      ctx.isAdmin,
    );
  }

  private async getPayrollSettlement(args: Args, ctx: ChatAuthContext) {
    const groupId = this.requireGroup(ctx);
    const year = Number(args.year);
    const month = Number(args.month);
    const periodYm = year * 100 + month;
    return this.choreService.getPayrollSettlement(groupId, ctx.user, periodYm);
  }

  private async getCoinBalance(args: Args, ctx: ChatAuthContext) {
    const memberId = await this.resolveMemberUserId(
      args.memberName,
      ctx,
      'financial',
    );
    const user =
      memberId && memberId !== 'all' ? this.asUserFor(memberId, ctx) : ctx.user;
    if (!ctx.isAdmin && user.id !== ctx.user.id) {
      throw new ChatToolForbiddenException();
    }
    return this.coinService.getCoinsByUser(user);
  }

  private async getCoinStatement(args: Args, ctx: ChatAuthContext) {
    const { from, to } = this.period(args);
    const memberId = await this.resolveMemberUserId(
      args.memberName,
      ctx,
      'financial',
    );
    return this.coinService.getStatement(ctx.user, {
      startDate: from,
      endDate: to,
      userId: memberId === 'all' ? 'all' : memberId,
      page: Number(args.page) || 1,
      limit: Number(args.limit) || 20,
    });
  }

  private async listMissions(ctx: ChatAuthContext) {
    return this.missionService.getMissionsWithProgress(ctx.user);
  }

  private async listThemes(ctx: ChatAuthContext) {
    return this.themeService.availableThemes(ctx.user);
  }

  private async listHealthExams(args: Args, ctx: ChatAuthContext) {
    const memberId = await this.resolveMemberUserId(
      args.memberName,
      ctx,
      'group',
    );
    return this.healthService.listExams(ctx.user, {
      page: '1',
      limit: '20',
      examName: args.examName ? String(args.examName) : undefined,
      doctorName: args.doctorName ? String(args.doctorName) : undefined,
      labName: args.labName ? String(args.labName) : undefined,
      dateFrom: args.from ? String(args.from) : undefined,
      dateTo: args.to ? String(args.to) : undefined,
      userId: memberId && memberId !== 'all' ? memberId : undefined,
    });
  }

  private async getLabItemEvolution(args: Args, ctx: ChatAuthContext) {
    const memberId = await this.resolveMemberUserId(
      args.memberName,
      ctx,
      'group',
    );
    return this.healthService.getLabItemEvolution(ctx.user, {
      itemName: String(args.itemName),
      dateFrom: args.from ? String(args.from) : undefined,
      dateTo: args.to ? String(args.to) : undefined,
      userId: memberId && memberId !== 'all' ? memberId : undefined,
    });
  }

  private async listPrescriptions(args: Args, ctx: ChatAuthContext) {
    const memberId = await this.resolveMemberUserId(
      args.memberName,
      ctx,
      'group',
    );
    return this.healthService.listPrescriptions(ctx.user, {
      page: '1',
      limit: '20',
      userId: memberId && memberId !== 'all' ? memberId : undefined,
    });
  }

  private async getMedicationSchedule(args: Args, ctx: ChatAuthContext) {
    const memberId = await this.resolveMemberUserId(
      args.memberName,
      ctx,
      'group',
    );
    const page = await this.healthService.listPrescriptions(ctx.user, {
      page: '1',
      limit: '50',
      userId: memberId && memberId !== 'all' ? memberId : undefined,
    });
    const medQ = args.medicationName
      ? String(args.medicationName).toLowerCase()
      : '';
    const schedules: Array<Record<string, unknown>> = [];
    for (const rx of page.data) {
      for (const item of rx.items ?? []) {
        if (medQ && !item.medicationName?.toLowerCase().includes(medQ)) {
          continue;
        }
        schedules.push({
          prescriptionId: rx.id,
          doctorName: rx.doctorName,
          medicationName: item.medicationName,
          dosage: item.dosage,
          scheduleTimes: item.scheduleTimes,
          daysOfWeek: item.daysOfWeek,
          startDate: item.startDate,
          endDate: item.endDate,
          notes: item.notes,
          patientName: rx.user?.name,
        });
      }
    }
    return { count: schedules.length, medications: schedules };
  }

  private async getHealthAiOverview(args: Args, ctx: ChatAuthContext) {
    const memberId = await this.resolveMemberUserId(
      args.memberName,
      ctx,
      'group',
    );
    return this.healthService.getLatestOverview(
      ctx.user,
      memberId && memberId !== 'all' ? memberId : undefined,
    );
  }

  private async listRecipes(args: Args, ctx: ChatAuthContext) {
    const page = await this.recipeService.findAll(
      { page: 1, limit: 50 },
      ctx.user,
    );
    const search = args.search ? String(args.search).toLowerCase() : '';
    const data = search
      ? page.data.filter((r) => r.title?.toLowerCase().includes(search))
      : page.data;
    return {
      total: data.length,
      items: data.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
      })),
    };
  }

  private async getRecipe(args: Args, ctx: ChatAuthContext) {
    return this.recipeService.findOne(String(args.id), ctx.user);
  }

  private async getAlexaStatus(ctx: ChatAuthContext) {
    const integrations = await this.profileService.getIntegrations(ctx.user.id);
    return { alexa: integrations.alexa ?? { connected: false } };
  }

  private async getAiQuota(_ctx: ChatAuthContext) {
    const usage = await this.apiQuotaService.getCurrentUsage('gemini-chat');
    const dailyLimit = this.appConfig.getGeminiChatDailyLimit();
    return {
      provider: 'gemini-chat',
      requestCount: usage.requestCount,
      dailyLimit: usage.dailyLimit || dailyLimit,
      remaining:
        usage.dailyLimit > 0
          ? usage.remaining
          : dailyLimit - usage.requestCount,
    };
  }
}
