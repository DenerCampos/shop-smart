import { EntityManager } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { ChoreDefinition } from '../entities/chore-definition.entity';
import { ChoreOccurrence } from '../entities/chore-occurrence.entity';
import { ChorePayrollSettlement } from '../entities/chore-payroll-settlement.entity';
import { CreateChoreDefinitionDto } from '../dto/create-chore-definition.dto';

/** Linha bruta da agregação de mesada pendente (valores vindos do banco). */
export interface ChorePayrollPendingRawRow {
  memberId: string;
  totalPending: string | null;
}

/** Modos de listagem de ocorrências (rotas diferentes / ordenação). */
export type ChoreOccurrenceListMode =
  | { kind: 'board'; statusParam?: string }
  | { kind: 'mine'; userId: string }
  | { kind: 'pending_approval' }
  | {
      kind: 'history';
      assignedUserIdOnly?: string;
      earnedPeriodYm?: number;
    };

export interface IChoreRepository {
  createDefinitionEntity(
    familyGroupId: string,
    user: User,
    dto: CreateChoreDefinitionDto,
    manager: EntityManager,
  ): Promise<ChoreDefinition>;

  createInitialOpenOccurrence(
    familyGroupId: string,
    definition: ChoreDefinition,
    manager: EntityManager,
  ): Promise<void>;

  findDefinitionsPage(
    familyGroupId: string,
    offset: number,
    limit: number,
  ): Promise<[ChoreDefinition[], number]>;

  findDefinitionByIdAndGroupWithRelations(
    definitionId: string,
    familyGroupId: string,
  ): Promise<ChoreDefinition | null>;

  findDefinitionById(id: string): Promise<ChoreDefinition | null>;

  saveDefinition(
    entity: ChoreDefinition,
    manager?: EntityManager,
  ): Promise<ChoreDefinition>;

  softRemoveDefinition(
    entity: ChoreDefinition,
    manager?: EntityManager,
  ): Promise<void>;

  findOccurrencesPage(
    familyGroupId: string,
    mode: ChoreOccurrenceListMode,
    offset: number,
    limit: number,
  ): Promise<[ChoreOccurrence[], number]>;

  findOneOccurrenceVisible(
    familyGroupId: string,
    occurrenceId: string,
  ): Promise<ChoreOccurrence | null>;

  saveOccurrence(
    entity: ChoreOccurrence,
    manager?: EntityManager,
  ): Promise<ChoreOccurrence>;

  findOccurrenceForStartLocked(
    occurrenceId: string,
    familyGroupId: string,
    manager: EntityManager,
  ): Promise<ChoreOccurrence | null>;

  findOccurrenceForApproveLocked(
    occurrenceId: string,
    familyGroupId: string,
    manager: EntityManager,
  ): Promise<ChoreOccurrence | null>;

  findOccurrenceWaitingApproval(
    occurrenceId: string,
    familyGroupId: string,
  ): Promise<ChoreOccurrence | null>;

  insertOpenOccurrence(
    familyGroupId: string,
    definition: ChoreDefinition,
    scheduledDate: Date | null,
    manager?: EntityManager,
  ): Promise<void>;

  aggregatePayrollPendingByMember(
    familyGroupId: string,
    periodYm: number,
  ): Promise<ChorePayrollPendingRawRow[]>;

  findPayrollSettlementByGroupAndPeriod(
    familyGroupId: string,
    periodYm: number,
  ): Promise<ChorePayrollSettlement | null>;

  findPendingPayrollOccurrencesLocked(
    familyGroupId: string,
    periodYm: number,
    manager: EntityManager,
  ): Promise<ChoreOccurrence[]>;

  createPayrollSettlement(
    familyGroupId: string,
    user: User,
    periodYm: number,
    manager: EntityManager,
  ): Promise<ChorePayrollSettlement>;

  createPayrollLine(
    settlement: ChorePayrollSettlement,
    memberId: string,
    amountMoney: number,
    manager: EntityManager,
  ): Promise<void>;

  linkOccurrencesToPayrollSettlement(
    occurrenceIds: string[],
    settlement: ChorePayrollSettlement,
    manager: EntityManager,
  ): Promise<void>;

  loadDefinitionByIdWithRelations(id: string): Promise<ChoreDefinition | null>;
}
