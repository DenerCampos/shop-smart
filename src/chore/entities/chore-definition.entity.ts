import { User } from 'src/user/entities/user.entity';
import { FamilyGroup } from 'src/family-group/entities/family-group.entity';
import { ChoreRecurrence } from '../types/chore-recurrence.type';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { ChoreOccurrence } from './chore-occurrence.entity';

@Entity({ name: 'chore_definition' })
export class ChoreDefinition {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @ManyToOne(() => FamilyGroup, { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'familyGroupId' })
  familyGroup: FamilyGroup;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column('decimal', { precision: 16, scale: 2 })
  rewardValue: number;

  @Column({ type: 'int', default: 0 })
  coinReward: number;

  @Column({ type: 'boolean', default: false })
  requirePhoto: boolean;

  @Column({
    type: 'enum',
    enum: ['once', 'daily', 'weekly'],
    default: 'once',
  })
  recurrence: ChoreRecurrence;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => User, { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User;

  @OneToMany(() => ChoreOccurrence, (occ) => occ.definition)
  occurrences: ChoreOccurrence[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
