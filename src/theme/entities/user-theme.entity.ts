import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { Theme } from './theme.entity';
import { User } from '../../user/entities/user.entity';

@Entity()
export class UserTheme {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @Column()
  userId: string;

  @Column()
  themeId: string;

  @Column({ default: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => User, (user) => user.themes)
  user: User;

  @ManyToOne(() => Theme, (theme) => theme.users)
  theme: Theme;
}
