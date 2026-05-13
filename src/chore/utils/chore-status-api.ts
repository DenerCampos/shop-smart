import { ChoreOccurrenceStatus } from '../types/chore-occurrence-status.type';

const map: Record<ChoreOccurrenceStatus, string> = {
  open: 'OPEN',
  in_progress: 'IN_PROGRESS',
  waiting_approval: 'WAITING_APPROVAL',
  completed: 'COMPLETED',
  rejected: 'REJECTED',
};

export function occurrenceStatusToApi(
  status: ChoreOccurrenceStatus | string,
): string {
  return map[status as ChoreOccurrenceStatus] ?? String(status).toUpperCase();
}
