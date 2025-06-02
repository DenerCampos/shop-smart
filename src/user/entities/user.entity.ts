import { Coupon } from 'src/coupon/entities/coupon.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  family: string;

  @Column()
  coatOfArms: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  token: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => Coupon, (coupon) => coupon.user)
  coupons: Coupon[];
}
