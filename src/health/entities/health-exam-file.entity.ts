import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { HealthExam } from './health-exam.entity';
import { HealthExamProcessing } from './health-exam-processing.entity';
import type { HealthFileType } from '../types/health.types';

@Entity({ name: 'health_exam_file' })
export class HealthExamFile {
  @Column({ type: 'varchar', length: 36, primary: true, generated: 'uuid' })
  id: string;

  @ManyToOne(() => HealthExam, (exam) => exam.files, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'examId' })
  exam: HealthExam | null;

  @ManyToOne(() => HealthExamProcessing, {
    onDelete: 'SET NULL',
    onUpdate: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'processingId' })
  processing: HealthExamProcessing | null;

  @Column({ length: 500 })
  fileUrl: string;

  @Column({
    type: 'enum',
    enum: ['PDF', 'IMAGE'],
    default: 'PDF',
  })
  fileType: HealthFileType;

  @Column({ length: 500, nullable: true })
  originalFilename: string | null;

  @Column({ type: 'int', nullable: true })
  pageCount: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
