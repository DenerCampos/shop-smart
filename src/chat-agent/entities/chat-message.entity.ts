import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { ChatSession } from './chat-session.entity';
import { ChatMessageRole } from '../types/chat-message-role.type';

@Entity({ name: 'chat_message' })
export class ChatMessage {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @ManyToOne(() => ChatSession, (session) => session.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sessionId' })
  session: ChatSession;

  @Column({ type: 'varchar', length: 36 })
  sessionId: string;

  @Column({ type: 'enum', enum: ['user', 'assistant', 'system'] })
  role: ChatMessageRole;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  screenContext: string | null;

  @Column({ type: 'json', nullable: true })
  toolTrace: Array<{ name: string; ok: boolean }> | null;

  @CreateDateColumn()
  createdAt: Date;
}
