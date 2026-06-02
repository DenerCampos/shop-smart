import { User } from 'src/user/entities/user.entity';
import { FamilyGroup } from 'src/family-group/entities/family-group.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { ChoreDefinition } from './chore-definition.entity';
import { ChoreOccurrenceStatus } from '../types/chore-occurrence-status.type';
import { ChorePayrollSettlement } from './chore-payroll-settlement.entity';

@Entity({ name: 'chore_occurrence' })
export class ChoreOccurrence {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @ManyToOne(() => ChoreDefinition, (def) => def.occurrences, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'choreDefinitionId' })
  definition: ChoreDefinition;

  @ManyToOne(() => FamilyGroup, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'familyGroupId' })
  familyGroup: FamilyGroup;

  @Column({
    type: 'enum',
    enum: ['open', 'in_progress', 'waiting_approval', 'completed', 'rejected'],
  })
  status: ChoreOccurrenceStatus;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'assignedToUserId' })
  assignedTo: User | null;

  /** Valor monetário efetivo (copiado da definição ao iniciar). */
  @Column('decimal', { precision: 16, scale: 2, nullable: true })
  snapshotRewardMoney: number | null;

  @Column({ type: 'int', nullable: true })
  snapshotCoinReward: number | null;

  @Column({ nullable: true })
  photoBeforeUrl: string | null;

  @Column({ nullable: true })
  photoAfterUrl: string | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'approvedByUserId' })
  approvedBy: User | null;

  @Column({ type: 'datetime', nullable: true })
  submittedAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  coinRewardCelebratedAt: Date | null;

  /** Calendar month when the chore became completed (earn month), formato YYYYMM. */
  @Column({ type: 'int', nullable: true })
  earnedPeriodYm: number | null;

  @ManyToOne(() => ChorePayrollSettlement, {
    nullable: true,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'payrollSettlementId' })
  payrollSettlement: ChorePayrollSettlement | null;

  /** Start of the window when this open occurrence is visible (next cycle for recurring). */
  @Column({ type: 'datetime', nullable: true })
  scheduledDate: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
