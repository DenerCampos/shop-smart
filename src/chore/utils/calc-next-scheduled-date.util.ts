import { type ChoreRecurrence } from '../types/chore-recurrence.type';

export type RecurringChore = Exclude<ChoreRecurrence, 'once'>;

/**
 * Próxima janela de ocorrência aberta após a aprovação,
 * avançando em passos de 1 dia (daily) ou 7 dias (weekly) a partir do ciclo da ocorrência aprovada.
 */
export function calcNextScheduledDate(
  anchorCreatedAt: Date,
  recurrence: RecurringChore,
  approvedAt: Date,
): Date {
  let periodDays: number;
  // Literais nos `case` para o narrow de `RecurringChore` (CHORE_RECURRENCES.* é tipado como union ampla)
  switch (recurrence) {
    case 'daily':
      periodDays = 1;
      break;
    case 'weekly':
      periodDays = 7;
      break;
    default: {
      const exhaustive: never = recurrence;
      throw new Error(`Recorrência inválida para agendamento: ${String(exhaustive)}`);
    }
  }

  const next = new Date(anchorCreatedAt);
  next.setDate(next.getDate() + periodDays);
  while (next.getTime() <= approvedAt.getTime()) {
    next.setDate(next.getDate() + periodDays);
  }
  return next;
}
