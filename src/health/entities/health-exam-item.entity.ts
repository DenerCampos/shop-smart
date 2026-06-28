import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { HealthExam } from './health-exam.entity';

@Entity({ name: 'health_exam_item' })
export class HealthExamItem {
  @Column({ type: 'varchar', length: 36, primary: true, generated: 'uuid' })
  id: string;

  @ManyToOne(() => HealthExam, (exam) => exam.items, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'examId' })
  exam: HealthExam;

  @Column({ length: 255 })
  itemName: string;

  /** Laboratório: material analisado (ex: Sangue) */
  @Column({ length: 255, nullable: true })
  material: string | null;

  /** Laboratório: método utilizado */
  @Column({ length: 255, nullable: true })
  method: string | null;

  /** Laboratório: valor numérico do resultado; Imagem: laudo completo em texto */
  @Column({ type: 'text', nullable: true })
  resultValue: string | null;

  /** Laboratório: unidade (mg/dL, mmol/L...) */
  @Column({ length: 100, nullable: true })
  resultUnit: string | null;

  /** Laboratório: faixa de referência (pode ser longa — ex.: múltiplas faixas por sexo/idade) */
  @Column({ type: 'text', nullable: true })
  referenceRange: string | null;

  /** Detectado como anormal pela IA ou manualmente */
  @Column({ type: 'boolean', default: false })
  isAbnormal: boolean;

  /** Laboratório: observação curta do laudo sobre o analito */
  @Column({ type: 'text', nullable: true })
  itemNotes: string | null;

  /** Imagem: aspectos observados / laudo descritivo */
  @Column({ type: 'text', nullable: true })
  findings: string | null;

  /** Imagem: impressão / conclusão diagnóstica */
  @Column({ type: 'text', nullable: true })
  conclusion: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
