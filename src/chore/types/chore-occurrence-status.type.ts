export type ChoreOccurrenceStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_approval'
  | 'completed'
  | 'rejected';

export const CHORE_OCCURRENCE_STATUS = {
  OPEN: 'open' as ChoreOccurrenceStatus,
  IN_PROGRESS: 'in_progress' as ChoreOccurrenceStatus,
  WAITING_APPROVAL: 'waiting_approval' as ChoreOccurrenceStatus,
  COMPLETED: 'completed' as ChoreOccurrenceStatus,
  REJECTED: 'rejected' as ChoreOccurrenceStatus,
};
