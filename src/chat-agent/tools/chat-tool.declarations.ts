import { FunctionDeclaration, SchemaType } from '@google/generative-ai';

const str = (description: string) => ({
  type: SchemaType.STRING,
  description,
});

const num = (description: string) => ({
  type: SchemaType.NUMBER,
  description,
});

const bool = (description: string) => ({
  type: SchemaType.BOOLEAN,
  description,
});

function obj(
  description: string,
  properties: Record<string, unknown>,
  required: string[] = [],
): FunctionDeclaration {
  return {
    name: description.split(':')[0],
    description: description.includes(':')
      ? description.slice(description.indexOf(':') + 1).trim()
      : description,
    parameters: {
      type: SchemaType.OBJECT,
      properties: properties as never,
      required,
    },
  };
}

/** Declarações Gemini (read-only). Nome da tool = chave do executor. */
export const CHAT_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  obj('get_current_user: Dados do usuário logado (sem senha/tokens).', {}),
  obj(
    'list_family_members: Lista integrantes do grupo familiar do usuário.',
    {},
  ),
  obj(
    'list_pending_invitations: Convites de família pendentes para o usuário.',
    {},
  ),
  obj(
    'get_family_summary: Resumo financeiro/stories do grupo no mês.',
    { month: num('Mês 1-12'), year: num('Ano YYYY') },
    ['month', 'year'],
  ),
  obj('list_latest_registrations: Últimos lançamentos (despesas/receitas).', {
    page: num('Página'),
    limit: num('Limite'),
  }),
  obj('list_expenses: Lista despesas com filtros.', {
    search: str('Busca no nome'),
    from: str('YYYY-MM-DD início'),
    to: str('YYYY-MM-DD fim'),
    memberName: str('Nome do membro (admin)'),
    isRecurring: bool('Só recorrentes'),
    isInstallment: bool('Só parceladas'),
    page: num('Página'),
    limit: num('Limite'),
  }),
  obj(
    'search_expense_items: Itens comprados (filtra por nome/categoria/loja/período).',
    {
      name: str('Nome do item'),
      category: str('Categoria/grupo (ex: alimentação)'),
      store: str('Loja/supermercado'),
      from: str('YYYY-MM-DD'),
      to: str('YYYY-MM-DD'),
      memberName: str('Nome do membro (admin)'),
    },
  ),
  obj('summarize_expenses: Soma despesas por período/categoria/loja.', {
    category: str('Categoria'),
    store: str('Loja'),
    from: str('YYYY-MM-DD'),
    to: str('YYYY-MM-DD'),
    memberName: str('Nome do membro (admin)'),
    groupBy: str('category | store | none'),
  }),
  obj(
    'get_expense: Detalhe de uma despesa por id.',
    {
      id: str('ID da despesa'),
    },
    ['id'],
  ),
  obj(
    'get_expense_receipt: Comprovante/resumo de despesa.',
    {
      id: str('ID'),
    },
    ['id'],
  ),
  obj('list_revenues: Lista receitas financeiras.', {
    search: str('Busca'),
    memberName: str('Nome do membro (admin)'),
    page: num('Página'),
    limit: num('Limite'),
  }),
  obj('summarize_revenues: Soma receitas no período.', {
    from: str('YYYY-MM-DD'),
    to: str('YYYY-MM-DD'),
    memberName: str('Nome do membro (admin)'),
  }),
  obj(
    'get_revenue: Detalhe receita financeira.',
    {
      id: str('ID'),
    },
    ['id'],
  ),
  obj('get_month_balance: Totais despesa vs receita do mês.', {
    month: num('Mês'),
    year: num('Ano'),
    memberName: str('Nome do membro (admin)'),
  }),
  obj('list_pending_recurring: Recorrências pendentes de confirmação.', {
    type: str('expense | revenue | both'),
  }),
  obj('list_stores: Lojas cadastradas do usuário.', {}),
  obj('list_categories: Categorias (grupos) de itens.', {}),
  obj('list_payments: Formas de pagamento.', {}),
  obj('report_expense_by_category: Relatório despesas por categoria.', {
    from: str('YYYY-MM-DD'),
    to: str('YYYY-MM-DD'),
    memberName: str('Membro ou all'),
  }),
  obj('report_expense_by_store: Relatório despesas por loja.', {
    from: str('YYYY-MM-DD'),
    to: str('YYYY-MM-DD'),
    memberName: str('Membro ou all'),
  }),
  obj('report_expense_by_date: Relatório despesas por dia.', {
    from: str('YYYY-MM-DD'),
    to: str('YYYY-MM-DD'),
    memberName: str('Membro ou all'),
  }),
  obj('report_most_purchased_items: Itens mais comprados.', {
    from: str('YYYY-MM-DD'),
    to: str('YYYY-MM-DD'),
    memberName: str('Membro ou all'),
  }),
  obj('report_expenses_vs_income: Comparativo 12 meses.', {
    year: num('Ano'),
    memberName: str('Membro ou all'),
  }),
  obj('list_warranties: Itens em garantia.', {
    search: str('Busca'),
    year: num('Ano'),
    includeExpired: bool('Incluir vencidas'),
    memberName: str('Membro ou all'),
  }),
  obj('list_shopping_lists: Listas de compras.', {
    status: str('active | completed | archived'),
  }),
  obj(
    'get_shopping_list: Detalhe de uma lista.',
    {
      id: str('ID'),
    },
    ['id'],
  ),
  obj(
    'search_shopping_suggestions: Sugestões de itens para lista.',
    {
      search: str('Texto'),
    },
    ['search'],
  ),
  obj('list_chore_definitions: Definições de tarefas do grupo.', {}),
  obj('search_chores: Busca ocorrências de tarefas.', {
    titleQuery: str('Trecho do título'),
    status: str('open|in_progress|waiting_approval|completed|rejected'),
    memberName: str('Responsável (admin)'),
  }),
  obj('list_pending_approvals: Tarefas aguardando aprovação (admin).', {}),
  obj('get_payroll_pending: Mesada pendente do período.', {
    year: num('Ano'),
    month: num('Mês'),
  }),
  obj('get_payroll_settlement: Liquidação de mesada do período.', {
    year: num('Ano'),
    month: num('Mês'),
  }),
  obj('get_coin_balance: Saldo de moedas.', {
    memberName: str('Membro (admin)'),
  }),
  obj('get_coin_statement: Extrato de moedas.', {
    from: str('YYYY-MM-DD'),
    to: str('YYYY-MM-DD'),
    memberName: str('Membro (admin)'),
    page: num('Página'),
    limit: num('Limite'),
  }),
  obj('list_missions: Missões e progresso do usuário.', {}),
  obj('list_themes: Temas disponíveis / desbloqueados.', {}),
  obj('list_health_exams: Exames de saúde.', {
    examName: str('Nome'),
    doctorName: str('Médico'),
    labName: str('Laboratório'),
    from: str('YYYY-MM-DD'),
    to: str('YYYY-MM-DD'),
    memberName: str('Paciente'),
  }),
  obj(
    'get_lab_item_evolution: Evolução de item laboratorial.',
    {
      itemName: str('Nome do item'),
      from: str('YYYY-MM-DD'),
      to: str('YYYY-MM-DD'),
      memberName: str('Paciente'),
    },
    ['itemName'],
  ),
  obj('list_prescriptions: Receituários médicos.', {
    memberName: str('Paciente'),
  }),
  obj('get_medication_schedule: Horários de um remédio.', {
    medicationName: str('Nome do medicamento'),
    memberName: str('Paciente'),
  }),
  obj('get_health_ai_overview: Último relatório de saúde (IA) em cache.', {
    memberName: str('Paciente'),
  }),
  obj('list_recipes: Receitas culinárias.', {
    search: str('Busca no título'),
  }),
  obj(
    'get_recipe: Detalhe de receita culinária.',
    {
      id: str('ID'),
    },
    ['id'],
  ),
  obj('get_alexa_status: Status da integração Alexa.', {}),
  obj('get_ai_quota: Uso/quota diária de IA (chat).', {}),
];
