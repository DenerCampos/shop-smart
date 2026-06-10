import { Group } from 'src/group/entities/group.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { Expense } from './expense.entity';

@Entity()
export class Item {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column({ type: 'float' })
  quantity: number;

  @Column()
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'int', nullable: true })
  warrantyDuration: number | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  warrantyUnit: 'days' | 'months' | 'years' | null;

  @Column({ type: 'datetime', nullable: true })
  warrantyExpiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => Group, (group) => group.items)
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @ManyToOne(() => Expense, (expense) => expense.items)
  @JoinColumn({ name: 'expenseId' })
  expense: Expense;
}
