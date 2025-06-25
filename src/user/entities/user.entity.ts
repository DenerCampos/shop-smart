import { Coin } from 'src/coin/entities/coin.entity';
import { CoinTransaction } from 'src/coin/entities/coinTransaction.entity';
import { Revenue } from 'src/revenue/entities/revenue.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  OneToOne,
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

  @Column({ nullable: true })
  refreshtoken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => Revenue, (revenue) => revenue.user)
  revenues: Revenue[];

  @OneToOne(() => Coin, (coin) => coin.user)
  coin: Coin[];

  @OneToMany(() => CoinTransaction, (coinTransactions) => coinTransactions.user)
  coinTransactions: CoinTransaction[];
}
