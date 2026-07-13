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
import { User } from 'src/user/entities/user.entity';
import { FamilyGroup } from 'src/family-group/entities/family-group.entity';
import { HealthExamItem } from './health-exam-item.entity';
import { HealthExamFile } from './health-exam-file.entity';
import type {
  HealthExamType,
  HealthSourceType,
  HealthExamStatus,
} from '../types/health.types';

@Entity({ name: 'health_exam' })
export class HealthExam {
  @Column({ type: 'varchar', length: 36, primary: true, generated: 'uuid' })
  id: string;

  @ManyToOne(() => FamilyGroup, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'familyGroupId' })
  familyGroup: FamilyGroup;

  @ManyToOne(() => User, { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => User, { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User;

  @Column({ length: 255, nullable: true })
  labName: string | null;

  @Column({ length: 255, nullable: true })
  doctorName: string | null;

  @Column({ type: 'date', nullable: true })
  examDate: string | null;

  @Column({
    type: 'enum',
    enum: ['LABORATORY', 'IMAGING', 'FUNCTIONAL', 'PROCEDURE', 'OTHER'],
    default: 'OTHER',
  })
  examType: HealthExamType;

  @Column({
    type: 'enum',
    enum: ['MANUAL', 'PDF', 'IMAGE_FILE'],
    default: 'MANUAL',
  })
  sourceType: HealthSourceType;

  @Column({
    type: 'enum',
    enum: ['PENDING_REVIEW', 'APPROVED'],
    default: 'APPROVED',
  })
  status: HealthExamStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => HealthExamItem, (item) => item.exam, { cascade: true })
  items: HealthExamItem[];

  @OneToMany(() => HealthExamFile, (file) => file.exam, { cascade: true })
  files: HealthExamFile[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
