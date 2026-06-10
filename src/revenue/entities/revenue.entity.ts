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

@Entity()
export class Revenue {
  @Column({
    type: 'varchar',
    length: 36,
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  value: number;

  @Column({ type: 'boolean', default: false })
  repeat: boolean;

  @Column({ type: 'varchar', length: 36, nullable: true })
  installmentGroupId: string | null;

  @Column({ type: 'int', nullable: true })
  installmentNumber: number | null;

  @Column({ type: 'int', nullable: true })
  totalInstallments: number | null;

  @Column({ type: 'boolean', default: false })
  isInstallment: boolean;

  @Column({ type: 'json', default: () => "'[]'" })
  photos: string[];

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  date: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => User, (user) => user.revenues)
  @JoinColumn({ name: 'userId' })
  user: User;
}
