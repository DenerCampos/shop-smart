import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { MissionDefinition } from './mission-definition.entity';

@Entity('user_mission_progress')
@Index(['userId', 'missionDefinitionId'], { unique: true })
export class UserMissionProgress {
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
  missionDefinitionId: string;

  @Column({ type: 'int', default: 0 })
  currentValue: number;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ default: false })
  isClaimed: boolean;

  @Column({ type: 'datetime', nullable: true })
  lastUpdatedAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  resetAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => MissionDefinition, (def) => def.progresses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'missionDefinitionId' })
  missionDefinition: MissionDefinition;
}
