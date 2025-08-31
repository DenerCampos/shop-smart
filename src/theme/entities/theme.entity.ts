import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { UserTheme } from './user-theme.entity';

@Entity()
export class Theme {
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
  theme: string;

  @Column()
  description: string;

  @Column()
  requiredCoins: number;

  @Column()
  background: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => UserTheme, (userTheme) => userTheme.theme)
  users: UserTheme[];
}
