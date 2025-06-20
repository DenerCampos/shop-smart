import { Payment } from 'src/payment/entities/payment.entity';
import { Store } from 'src/store/entities/store.entity';
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
import { Item } from './item.entity';

@Entity()
export class Expense {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  url: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  value: number;

  @Column({ type: 'boolean', default: false })
  repeat: boolean;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  date: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => Item, (item) => item.expense, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  items: Item[];

  @ManyToOne(() => Store, (store) => store.expenses)
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @ManyToOne(() => Payment, (payment) => payment.expenses)
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @ManyToOne(() => User, (user) => user.revenues)
  @JoinColumn({ name: 'userId' })
  user: User;
}
