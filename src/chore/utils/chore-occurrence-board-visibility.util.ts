import { CHORE_OCCURRENCE_STATUS } from '../types/chore-occurrence-status.type';

/**
 * Regra espelhada em `ChoreRepository.findOccurrencesPage` (board / open)
 * e `findOneOccurrenceVisible`: ocorrências OPEN com `scheduledDate` futuro não aparecem até a data.
 */
export function isChoreOccurrenceVisibleForParticipant(
  status: string,
  scheduledDate: Date | null,
  now: Date,
): boolean {
  if (status !== CHORE_OCCURRENCE_STATUS.OPEN) {
    return true;
  }
  return (
    scheduledDate == null || scheduledDate.getTime() <= now.getTime()
  );
}
