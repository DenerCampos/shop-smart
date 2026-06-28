import { EntityManager } from 'typeorm';
import { HealthPrescription } from '../entities/health-prescription.entity';
import { HealthPrescriptionItem } from '../entities/health-prescription-item.entity';
import type { HealthPrescriptionFilterDto } from '../dto/health-prescription-filter.dto';

export interface HealthPrescriptionListResult {
  data: HealthPrescription[];
  total: number;
  page: number;
  limit: number;
}

export interface IHealthPrescriptionRepository {
  create(
    data: Partial<HealthPrescription>,
    items: Partial<HealthPrescriptionItem>[],
    manager?: EntityManager,
  ): Promise<HealthPrescription>;

  findById(
    id: string,
    manager?: EntityManager,
  ): Promise<HealthPrescription | null>;

  findAll(
    filter: HealthPrescriptionFilterDto,
    groupId: string | null,
    requestingUserId: string,
    manager?: EntityManager,
  ): Promise<HealthPrescriptionListResult>;

  save(
    rx: HealthPrescription,
    manager?: EntityManager,
  ): Promise<HealthPrescription>;

  replaceItems(
    prescriptionId: string,
    items: Partial<HealthPrescriptionItem>[],
    manager?: EntityManager,
  ): Promise<void>;

  softDelete(id: string, manager?: EntityManager): Promise<void>;
}
