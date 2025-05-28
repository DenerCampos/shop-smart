import { Store } from 'src/store/entities/store.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Item } from './item.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { User } from 'src/user/entities/user.entity';

@Entity()
export class Coupon {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @Column()
  number: string;

  @Column({ nullable: true })
  url: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  value: number;

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

  @ManyToOne(() => Store, (store) => store.coupons)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @OneToMany(() => Item, (item) => item.coupon, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  items: Item[];

  @ManyToOne(() => Payment, (payment) => payment.coupons)
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @ManyToOne(() => User, (user) => user.coupons)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
