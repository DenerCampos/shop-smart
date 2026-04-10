import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { TextRecognitionStatus } from '../types/textRecognitionType';

@Entity('text_recognition')
export class TextRecognition {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @Column({ type: 'text', nullable: true })
  sourceText: string;

  @Column({ type: 'varchar', length: 50 })
  provider: string;

  @Column({ type: 'float', default: 0 })
  confidence: number;

  @Column({ type: 'json', nullable: true })
  result: unknown;

  @Column({
    type: 'enum',
    enum: TextRecognitionStatus,
    default: TextRecognitionStatus.PROCESSING,
  })
  status: TextRecognitionStatus;

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
