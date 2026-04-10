import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { OauthCode } from './oauth-code.entity';

@Entity('oauth_client')
export class OauthClient {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  clientId: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  clientSecret: string;

  @Column({ type: 'simple-json' })
  redirectUris: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => OauthCode, (code) => code.client)
  codes: OauthCode[];
}
