import { CHORE_OCCURRENCE_STATUS } from '../types/chore-occurrence-status.type';
import { isChoreOccurrenceVisibleForParticipant } from './chore-occurrence-board-visibility.util';

describe('isChoreOccurrenceVisibleForParticipant', () => {
  const now = new Date(2026, 5, 15, 12, 0, 0);

  it('OPEN com scheduledDate nulo — visível', () => {
    expect(
      isChoreOccurrenceVisibleForParticipant(
        CHORE_OCCURRENCE_STATUS.OPEN,
        null,
        now,
      ),
    ).toBe(true);
  });

  it('OPEN com scheduledDate no passado — visível', () => {
    expect(
      isChoreOccurrenceVisibleForParticipant(
        CHORE_OCCURRENCE_STATUS.OPEN,
        new Date(2026, 5, 14, 12, 0, 0),
        now,
      ),
    ).toBe(true);
  });

  it('OPEN com scheduledDate no futuro — oculto (alinha ao board)', () => {
    expect(
      isChoreOccurrenceVisibleForParticipant(
        CHORE_OCCURRENCE_STATUS.OPEN,
        new Date(2026, 5, 16, 12, 0, 0),
        now,
      ),
    ).toBe(false);
  });

  it('status diferente de OPEN — sempre visível (filtro só para OPEN agendado)', () => {
    expect(
      isChoreOccurrenceVisibleForParticipant(
        CHORE_OCCURRENCE_STATUS.IN_PROGRESS,
        new Date(2099, 0, 1),
        now,
      ),
    ).toBe(true);
  });
});
