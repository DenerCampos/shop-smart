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
import { HealthPrescriptionItem } from './health-prescription-item.entity';

@Entity({ name: 'health_prescription' })
export class HealthPrescription {
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

  @Column({ length: 255 })
  doctorName: string;

  @Column({ type: 'date' })
  prescriptionDate: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => HealthPrescriptionItem, (item) => item.prescription, {
    cascade: true,
  })
  items: HealthPrescriptionItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
