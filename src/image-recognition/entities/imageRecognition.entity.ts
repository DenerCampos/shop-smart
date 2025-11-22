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
import {
  ImageRecognitionResult,
  RecognitionStatus,
} from '../types/imageRecognitionType';

@Entity()
export class ImageRecognition {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @Column()
  imageUrl: string;

  @Column()
  provider: string;

  @Column({
    type: 'enum',
    enum: RecognitionStatus,
    default: RecognitionStatus.PROCESSING,
  })
  status: RecognitionStatus;

  @Column({ type: 'json', nullable: true })
  result?: ImageRecognitionResult;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  confidence?: number;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => User, (user) => user.imageRecognitions)
  @JoinColumn({ name: 'userId' })
  user: User;
}
