import { Column, CreateDateColumn, Entity, ManyToOne } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { OauthClient } from './oauth-client.entity';

@Entity('oauth_code')
export class OauthCode {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 500 })
  redirectUri: string;

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => OauthClient, (client) => client.codes, {
    onDelete: 'CASCADE',
  })
  client: OauthClient;
}
