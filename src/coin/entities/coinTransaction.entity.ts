import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { TransactionType } from '../types/coinType';

@Entity()
export class CoinTransaction {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @Column('numeric', { default: 0 })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  transactionType: TransactionType;

  @Column({ nullable: true })
  description: string;

  @Column('numeric', { default: 0 })
  balanceBefore: number;

  @Column('numeric', { default: 0 })
  balanceAfter: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => User, (user) => user.coupons)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
