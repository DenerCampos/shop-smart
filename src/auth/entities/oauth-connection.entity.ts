import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { OauthClient } from './oauth-client.entity';

@Entity('oauth_connection')
@Unique(['user', 'client'])
export class OauthConnection {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @CreateDateColumn()
  linkedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => OauthClient, { onDelete: 'CASCADE', eager: true })
  client: OauthClient;
}
