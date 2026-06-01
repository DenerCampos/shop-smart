import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { MissionFrequency } from '../types/mission-frequency.enum';
import { UserMissionProgress } from './user-mission-progress.entity';

@Entity('mission_definition')
export class MissionDefinition {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @Column({ unique: true })
  key: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: MissionFrequency })
  frequency: MissionFrequency;

  @Column({ type: 'int' })
  rewardCoins: number;

  @Column({ type: 'int' })
  targetValue: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(
    () => UserMissionProgress,
    (progress) => progress.missionDefinition,
  )
  progresses: UserMissionProgress[];
}
