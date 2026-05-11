import { User } from 'src/user/entities/user.entity';
import { FamilyGroup } from 'src/family-group/entities/family-group.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ChorePayrollLine } from './chore-payroll-line.entity';

@Entity({ name: 'chore_payroll_settlement' })
@Unique(['familyGroup', 'periodYm'])
export class ChorePayrollSettlement {
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

  @Column({ type: 'int' })
  periodYm: number;

  @ManyToOne(() => User, { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'settledByUserId' })
  settledBy: User;

  @Column({ type: 'datetime' })
  settledAt: Date;

  @OneToMany(() => ChorePayrollLine, (line) => line.settlement)
  lines: ChorePayrollLine[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
