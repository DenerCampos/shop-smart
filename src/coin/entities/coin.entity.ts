import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Coin {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @Column('numeric', { default: 0 })
  balance: number;

  @Column('numeric', { default: 0 })
  totalEarned: number;

  @Column('numeric', { default: 0 })
  totalSpent: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToOne(() => User, (user) => user.coin)
  @JoinColumn({ name: 'userId' })
  user: User;
}
