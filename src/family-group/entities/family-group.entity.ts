import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { FamilyGroupMember } from './family-group-member.entity';
import { DEFAULT_FAMILY_GROUP_COAT_OF_ARMS } from '../constants/family-group-image.constant';

@Entity()
export class FamilyGroup {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @Column()
  name: string;

  @Column({ default: DEFAULT_FAMILY_GROUP_COAT_OF_ARMS })
  coatOfArms: string;

  @Column({ nullable: true })
  groupImage: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @OneToMany(() => FamilyGroupMember, (member) => member.familyGroup)
  members: FamilyGroupMember[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
