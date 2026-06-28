import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { HealthPrescription } from './health-prescription.entity';

@Entity({ name: 'health_prescription_item' })
export class HealthPrescriptionItem {
  @Column({ type: 'varchar', length: 36, primary: true, generated: 'uuid' })
  id: string;

  @ManyToOne(() => HealthPrescription, (rx) => rx.items, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'prescriptionId' })
  prescription: HealthPrescription;

  @Column({ length: 255 })
  medicationName: string;

  /** Ex: "1 comprimido de 10mg" */
  @Column({ length: 255, nullable: true })
  dosage: string | null;

  /** JSON: ["08:00","14:00","20:00"] */
  @Column({ type: 'json', nullable: true })
  scheduleTimes: string[] | null;

  /** JSON: null = todos os dias, ["Mon","Wed","Fri"] = dias específicos */
  @Column({ type: 'json', nullable: true })
  daysOfWeek: string[] | null;

  @Column({ type: 'date', nullable: true })
  startDate: string | null;

  /** null = uso indeterminado */
  @Column({ type: 'date', nullable: true })
  endDate: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
