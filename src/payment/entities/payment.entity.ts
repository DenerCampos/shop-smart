import { Expense } from 'src/expense/entities/expense.entity';
import { User } from 'src/user/entities/user.entity';
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

@Entity()
export class Payment {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => Expense, (expense) => expense.payment)
  expenses: Expense[];

  @ManyToOne(() => User, (user) => user.payments)
  @JoinColumn({ name: 'userId' })
  user: User;
}
