import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { RecognitionStatus } from '../types/audioRecognitionType';

@Entity('audio_recognition')
export class AudioRecognition {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  audioUrl: string;

  @Column({ type: 'varchar', length: 50 })
  provider: string;

  @Column({ type: 'float', default: 0 })
  confidence: number;

  @Column({ type: 'json', nullable: true })
  result: any;

  @Column({
    type: 'enum',
    enum: RecognitionStatus,
    default: RecognitionStatus.PROCESSING,
  })
  status: RecognitionStatus;

  @Column({ type: 'text', nullable: true })
  error: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
