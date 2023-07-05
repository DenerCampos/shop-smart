import { Group } from 'src/group/entities/group.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Coupon } from './coupon.entity';

@Entity()
export class Item {
  @PrimaryGeneratedColumn('uuid')
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

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  purchaseDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => Group, (group) => group.items)
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => Coupon, (coupon) => coupon.items)
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon;
}
