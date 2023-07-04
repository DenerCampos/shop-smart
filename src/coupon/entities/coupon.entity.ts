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

@Entity()
export class Coupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  number: string;

  @Column({ nullable: true })
  url: string;

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
}
