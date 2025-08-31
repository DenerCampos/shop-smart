import { Coin } from 'src/coin/entities/coin.entity';
import { CoinTransaction } from 'src/coin/entities/coinTransaction.entity';
import { Group } from 'src/group/entities/group.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { Revenue } from 'src/revenue/entities/revenue.entity';
import { Store } from 'src/store/entities/store.entity';
import { UserTheme } from 'src/theme/entities/user-theme.entity';
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

  @OneToMany(() => Group, (group) => group.user)
  groups: Group[];

  @OneToMany(() => Payment, (payment) => payment.user)
  payments: Payment[];

  @OneToMany(() => Store, (store) => store.user)
  stores: Store[];

  @OneToMany(() => UserTheme, (userTheme) => userTheme.user)
  themes: UserTheme[];
}
