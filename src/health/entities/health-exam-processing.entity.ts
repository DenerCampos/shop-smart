import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { FamilyGroup } from 'src/family-group/entities/family-group.entity';
import type {
  ExtractedExamData,
  HealthFileType,
  HealthProcessingStatus,
} from '../types/health.types';

@Entity({ name: 'health_exam_processing' })
export class HealthExamProcessing {
  @Column({ type: 'varchar', length: 36, primary: true, generated: 'uuid' })
  id: string;

  @ManyToOne(() => FamilyGroup, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'familyGroupId' })
  familyGroup: FamilyGroup;

  @ManyToOne(() => User, { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'uploadedByUserId' })
  uploadedBy: User;

  @ManyToOne(() => User, { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'targetUserId' })
  targetUser: User;

  @Column({ length: 500 })
  fileUrl: string;

  @Column({ type: 'enum', enum: ['PDF', 'IMAGE'], default: 'PDF' })
  fileType: HealthFileType;

  @Column({ length: 500, nullable: true })
  originalFilename: string | null;

  @Column({ type: 'int', default: 0, nullable: true })
  totalPages: number;

  @Column({ type: 'int', default: 0 })
  currentPage: number;

  @Column({
    type: 'enum',
    enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'QUEUED',
  })
  status: HealthProcessingStatus;

  @Column({ type: 'json', nullable: true })
  extractedData: ExtractedExamData | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  /** Momento da última falha — usado para retry automático após 2h. */
  @Column({ type: 'datetime', precision: 6, nullable: true })
  failedAt: Date | null;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
