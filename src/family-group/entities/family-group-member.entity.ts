import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { FamilyGroup } from './family-group.entity';
import { FamilyGroupRole } from '../types/family-group-role.type';
import { FamilyGroupMemberStatus } from '../types/family-group-member-status.type';

@Entity()
export class FamilyGroupMember {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @ManyToOne(() => FamilyGroup, (group) => group.members)
  @JoinColumn({ name: 'familyGroupId' })
  familyGroup: FamilyGroup;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  invitedEmail: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'member'],
    default: 'member',
  })
  role: FamilyGroupRole;

  @Column({
    type: 'enum',
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  })
  status: FamilyGroupMemberStatus;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invitedById' })
  invitedBy: User;

  @Column({ type: 'datetime', nullable: true })
  joinedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
